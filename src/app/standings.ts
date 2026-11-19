import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, catchError, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-standings',
  imports: [DecimalPipe, TranslatePipe, MatButtonModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h1 id="standings-title">{{ 'Classement de la saison' | t }} @if (standings(); as data) { {{ data.year }} }</h1>
    @if (standings(); as data) {
      <mat-form-field appearance="outline">
        <mat-label>{{ 'Catégorie' | t }}</mat-label>
        <mat-select [value]="category()" (selectionChange)="category.set($event.value)">
          <mat-option value="">{{ 'Classement général' | t }}</mat-option>
          @for (item of data.categories; track item.code) {
            <mat-option [value]="item.code">{{ item.label | t }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      @if (rows().length) {
        <div class="table-wrap" role="region" aria-labelledby="standings-title" tabindex="0">
          <table aria-labelledby="standings-title">
            <thead>
              <tr>
                <th scope="col">{{ 'Rang' | t }}</th>
                <th scope="col">{{ 'Coureur' | t }}</th>
                <th scope="col">{{ 'Catégorie' | t }}</th>
                <th scope="col">{{ 'Courses' | t }}</th>
                <th scope="col">{{ 'Points courses' | t }}</th>
                <th scope="col">{{ 'Bonus' | t }}</th>
                <th scope="col">{{ 'Total' | t }}</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.entry) {
                <tr [class.provisional]="row.rank === null">
                  <td>{{ row.rank ?? ('Provisoire' | t) }}</td>
                  <th scope="row">{{ row.entry.firstName }} {{ row.entry.lastName }}</th>
                  <td>{{ row.categoryLabel | t }}</td>
                  <td>{{ row.entry.score.participations | number:'1.0-0':i18n.locale() }}</td>
                  <td>{{ row.entry.score.resultPoints | number:'1.0-0':i18n.locale() }}</td>
                  <td>{{ row.entry.score.bonusPoints | number:'1.0-0':i18n.locale() }}</td>
                  <td><strong>{{ row.total | number:'1.0-0':i18n.locale() }}</strong></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
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
    .table-wrap { overflow-x: auto; border: 1px solid #dbe2ec; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; background: #fff; color: #172b48; }
    th, td { padding: .75rem; border-bottom: 1px solid #e5eaf0; text-align: start; white-space: nowrap; }
    thead th { background: #eef3f8; }
    th:nth-child(n+4), td:nth-child(n+4) { text-align: end; font-variant-numeric: tabular-nums; }
    tbody tr:last-child > * { border-bottom: 0; }
    .provisional { color: #964000; background: #fff5e9; }
  `,
})
export class Standings {
  protected readonly i18n = inject(LanguageService);
  protected readonly category = signal('');
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
}