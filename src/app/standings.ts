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
import { localizedPaginatorProvider } from './paginator-intl';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';
import { RankedRunnerAvatar } from './ranked-runner-avatar';

@Component({
  selector: 'app-standings',
  providers: [localizedPaginatorProvider],
  imports: [RankedRunnerAvatar, DecimalPipe, TranslatePipe, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatPaginatorModule],
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
                  <app-ranked-runner-avatar [runner]="row.entry" [rank]="row.rank" [failedPictures]="failedPictures" />
                  <div class="result-person-copy"><strong [title]="row.entry.firstName + ' ' + row.entry.lastName">{{ row.entry.firstName }} {{ row.entry.lastName }}</strong></div>
                </button>
                <span class="category-pill" [title]="row.categoryLabel | t">{{ row.categoryLabel | t }}</span>
              </div>
              @if (row.rank === null) { <div class="provisional-label">{{ 'Provisoire' | t }}</div> }
              <dl>
                <div><dt>{{ 'Courses' | t }}</dt><dd>{{ row.entry.score.participations | number:'1.0-0':i18n.locale() }}</dd></div>
                <div><dt><abbr [title]="'Points' | t">pts</abbr></dt><dd>{{ row.entry.score.resultPoints | number:'1.0-0':i18n.locale() }}</dd></div>
                <div><dt>{{ 'Bonus' | t }}</dt><dd>{{ row.entry.score.bonusPoints | number:'1.0-0':i18n.locale() }}</dd></div>
                <div class="score-total"><dt>{{ 'Total' | t }}</dt><dd><strong>{{ row.total | number:'1.0-0':i18n.locale() }}</strong></dd></div>
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
    :host { display: block; container-type: inline-size; }
    h1 { margin-block: 0 1rem; }
    mat-form-field { width: min(100%, 19rem); }
    .standing-cards {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) clamp(3.25rem, 19cqi, 6rem);
      gap: 12px 8px;
      padding: 0;
      margin: 0 0 12px;
      list-style: none;
    }
    .standing-card {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: subgrid;
      grid-template-rows: 50px 1rem 2.5rem;
      row-gap: 4px;
      padding: 14px;
      border: 1px solid var(--acrho-border);
      border-radius: 12px;
      background: var(--acrho-surface, color-mix(in srgb, #fff 85%, var(--acrho-soft)));
      color: var(--acrho-heading);
    }
    .card-heading {
      display: grid;
      grid-column: 1 / 4;
      grid-row: 1;
      grid-template-columns: subgrid;
      align-items: center;
    }
    .result-rank { font-variant-numeric: tabular-nums; }
    .card-heading .category-pill {
      box-sizing: border-box;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .provisional-label { grid-column: 2 / -1; grid-row: 2; font-size: .75rem; line-height: 1rem; font-weight: 700; }
    dl {
      display: grid;
      grid-column: 1 / -1;
      grid-row: 3;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
    }
    dl > div { text-align: end; }
    dt { font-size: .75rem; }
    dt abbr { text-decoration: none; }
    dd { margin: 0; font-variant-numeric: tabular-nums; }
    .runner-link {
      display: grid;
      grid-template-columns: 58px minmax(0, 1fr);
      justify-items: start;
      height: 100%;
      gap: 6px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    .runner-link app-ranked-runner-avatar { justify-self: center; }
    .runner-link strong {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      font-size: clamp(1rem, 2.5vw, 1.125rem);
      line-height: 1.25;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .standing-card:hover { border-color: var(--acrho-accent); }
    .runner-link:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
    .provisional { color: #964000; background: #fff5e9; }
    @container (width < 680px) {
      .standing-cards { grid-template-columns: 42px 58px minmax(0, 1fr); column-gap: 6px; }
      .standing-card { grid-template-rows: 72px 1rem 2.5rem; }
      .card-heading { grid-template-rows: 50px 22px; }
      .runner-link { grid-column: 2 / 4; grid-row: 1; grid-template-columns: subgrid; }
      .card-heading .category-pill { grid-column: 3; grid-row: 2; justify-self: start; width: auto; max-width: 100%; }
    }
    @container (min-width: 680px) {
      .standing-cards {
        grid-template-columns: 42px minmax(0, 1fr) 6rem 5.5rem repeat(4, clamp(3rem, 6cqi, 5rem));
        column-gap: clamp(8px, 1.5cqi, 20px);
      }
      .standing-card { grid-template-rows: 50px; align-items: stretch; padding-block: 8px; }
      .card-heading, .provisional-label, dl { grid-row: 1; }
      .provisional-label { grid-column: 4; align-self: center; }
      dl { grid-column: 5 / -1; grid-template-columns: subgrid; align-content: center; column-gap: inherit; }
    }
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