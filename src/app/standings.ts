import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, catchError, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi, Runner, StandingEntry } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-standings',
  imports: [DecimalPipe, TranslatePipe, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatPaginatorModule],
  template: `
    <h1 id="standings-title">{{ 'Classement de la saison' | t }} @if (standings(); as data) { {{ data.year }} }</h1>
    @if (standings(); as data) {
      <mat-form-field appearance="outline">
        <mat-label>{{ 'Catégorie' | t }}</mat-label>
        <mat-select [value]="category()" (selectionChange)="selectCategory($event.value)">
          <mat-option value="">{{ 'Classement général' | t }}</mat-option>
          @for (item of data.categories; track item.code) {
            <mat-option [value]="item.code">{{ item.label | t }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      @if (rows().length) {
        <ul class="standing-cards" aria-labelledby="standings-title">
          @for (row of visibleRows(); track row.entry.runnerId) {
            <li class="standing-card" [class.provisional]="row.rank === null">
              <div class="card-heading">
                <span class="result-rank" [attr.aria-label]="row.rank === null ? null : ('Rang' | t) + ' ' + row.rank">
                  {{ (row.rank | number:'1.0-0':i18n.locale()) ?? '—' }}
                </span>
                <button class="runner-link result-person" type="button" (click)="openRunner(row.entry, data.year)"
                        [attr.aria-label]="('Voir les résultats de ' | t) + row.entry.firstName + ' ' + row.entry.lastName">
                  <div class="runner-avatar result-avatar" aria-hidden="true">
                    @if (row.entry.pictureUrl && !failedPictures.has(row.entry.pictureUrl)) {
                      <img [src]="row.entry.pictureUrl" alt="" loading="lazy" referrerpolicy="no-referrer"
                           (error)="failedPictures.add(row.entry.pictureUrl)">
                    } @else {
                      {{ row.entry.firstName[0] }}{{ row.entry.lastName[0] }}
                    }
                  </div>
                  <div class="result-person-copy"><strong>{{ row.entry.firstName }} {{ row.entry.lastName }}</strong></div>
                </button>
                <span class="category-pill">{{ row.categoryLabel | t }}</span>
              </div>
              @if (row.rank === null) { <div class="provisional-label">{{ 'Provisoire' | t }}</div> }
              <dl>
                <div><dt>{{ 'Courses' | t }}</dt><dd>{{ row.entry.score.participations | number:'1.0-0':i18n.locale() }}</dd></div>
                <div><dt>{{ 'Points' | t }}</dt><dd>{{ row.entry.score.resultPoints | number:'1.0-0':i18n.locale() }}</dd></div>
                <div><dt>{{ 'Bonus' | t }}</dt><dd>{{ row.entry.score.bonusPoints | number:'1.0-0':i18n.locale() }}</dd></div>
                <div><dt>{{ 'Total' | t }}</dt><dd><strong>{{ row.total | number:'1.0-0':i18n.locale() }}</strong></dd></div>
              </dl>
            </li>
          }
        </ul>
        <mat-paginator [attr.aria-label]="'Classement de la saison' | t" [length]="rows().length"
                       [pageIndex]="page().pageIndex" [pageSize]="page().pageSize" [pageSizeOptions]="[20, 50, 100]"
                       (page)="changePage($event)" />
      } @else {
        <p role="status">{{ (category() ? 'Aucun résultat pour cette catégorie.' : 'Aucun classement pour cette saison.') | t }}</p>
      }
    } @else if (standings() === null) {
      <div role="alert">
        {{ 'Le classement est indisponible.' | t }}
        <button mat-button type="button" (click)="reload.next()">{{ 'Réessayer' | t }}</button>
      </div>
    } @else {
      <div role="status">
        <mat-spinner diameter="34" [attr.aria-label]="'Chargement du classement…' | t" />
      </div>
    }
  `,
  styles: `
    h1 { margin-block: 0 1rem; }
    mat-form-field { width: min(100%, 19rem); }
    .standing-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
      gap: 12px;
      padding: 0;
      margin: 0 0 12px;
      list-style: none;
    }
    .standing-card {
      display: grid;
      align-content: start;
      gap: 10px;
      padding: 14px;
      border: 1px solid var(--acrho-border);
      border-radius: 12px;
      background: #fff;
      color: var(--acrho-heading);
    }
    .card-heading { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; }
    .card-heading .category-pill { max-width: 6rem; overflow-wrap: anywhere; }
    .provisional-label { font-size: .75rem; font-weight: 700; }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0; }
    dt { font-size: .75rem; }
    dd { margin: 0; font-variant-numeric: tabular-nums; }
    .runner-link {
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .runner-link:hover strong { text-decoration: underline; }
    .runner-link:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
    .provisional { color: #964000; background: #fff5e9; }
  `,
})
export class Standings {
  readonly runnerSelected = output<{ runner: Runner; year: number }>();

  protected openRunner(entry: StandingEntry, year: number) {
    const { runnerId, firstName, lastName, category, pictureUrl } = entry;
    this.runnerSelected.emit({ runner: { id: runnerId, firstName, lastName, category, pictureUrl, categoryYear: year }, year });
  }
  protected readonly i18n = inject(LanguageService);
  protected readonly failedPictures = new Set<string>();
  protected readonly category = signal('');
  protected readonly page = signal({ pageIndex: 0, pageSize: 20 });

  protected selectCategory(category: string) {
    this.category.set(category);
    this.page.update(page => ({ ...page, pageIndex: 0 }));
  }

  protected changePage({ pageIndex, pageSize }: PageEvent) {
    this.page.set({ pageIndex, pageSize });
  }
  protected readonly reload = new Subject<void>();
  private readonly api = inject(AcrhoApi);
  protected readonly standings = toSignal(this.reload.pipe(
    startWith(undefined),
    switchMap(() => this.api.currentStandings().pipe(
      catchError(() => of(null)),
      startWith(undefined),
    )),
  ));

  protected readonly rows = computed(() => {
    const data = this.standings();
    const category = this.category();
    if (!data) return [];

    const labels = new Map(data.categories.map(item => [item.code, item.label]));
    let qualified = 0;
    let rank = 0;
    let previousTotal: number | undefined;
    return data.entries.filter(entry => !category || entry.category === category).map(entry => {
      const total = entry.score.resultPoints + entry.score.bonusPoints;
      const provisional = entry.score.participations < data.minimumParticipations;
      if (!provisional) {
        qualified++;
        if (total !== previousTotal) rank = qualified;
        previousTotal = total;
      }
      const categoryLabel = entry.category ? labels.get(entry.category) ?? entry.category : '—';
      return { entry, categoryLabel, total, rank: provisional ? null : rank };
    });
  });

  protected readonly visibleRows = computed(() => {
    const { pageIndex, pageSize } = this.page();
    const start = pageIndex * pageSize;
    return this.rows().slice(start, start + pageSize);
  });
}