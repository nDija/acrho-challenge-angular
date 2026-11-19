import { DecimalPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-runner-standing-card',
  imports: [DecimalPipe, MatIconModule, TranslatePipe],
  template: `
    <section aria-labelledby="runner-standing-title">
      <h2 id="runner-standing-title">
        <mat-icon aria-hidden="true">leaderboard</mat-icon>
        {{ 'Classement de la saison' | t }} {{ standing()?.year }}
      </h2>
      @if (standing(); as data) {
        @if (data.placement; as placement) {
          <dl [class.provisional]="placement.provisional">
            <div>
              <dt>{{ 'Place au général' | t }}</dt>
              <dd>{{ placement.overallRank ?? '—' }}</dd>
            </div>
            <div>
              <dt>{{ 'Place catégorie' | t }} @if (placement.category) { ({{ placement.category }}) }</dt>
              <dd>{{ placement.categoryRank ?? '—' }}</dd>
            </div>
            <div>
              <dt>{{ 'Points' | t }}</dt>
              <dd>{{ placement.points | number:'1.0-0':i18n.locale() }}</dd>
            </div>
          </dl>
          @if (placement.provisional) { <p class="provisional">{{ 'Provisoire' | t }}</p> }
        } @else {
          <p>{{ 'Aucun score cette saison.' | t }}</p>
        }
      } @else {
        <p role="status">{{ (standing() === null ? 'Le classement est indisponible.' : 'Chargement du classement…') | t }}</p>
      }
    </section>
  `,
  styles: `
    :host { display: block; margin: 0 0 24px; }
    section { padding: 16px 20px; border: 1px solid var(--acrho-border); border-radius: 13px; background: white; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--acrho-heading); font-size: 1rem; }
    mat-icon { color: var(--acrho-accent); }
    dl { display: flex; flex-wrap: wrap; gap: 12px 28px; margin: 12px 0 0; }
    dt { font-size: .8rem; }
    dd { margin: 0; font-size: 1.2rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    p { margin: 8px 0 0; }
    .provisional { color: #964000; }
  `,
})
export class RunnerStandingCard {
  readonly runnerId = input.required<number>();
  protected readonly i18n = inject(LanguageService);
  private readonly api = inject(AcrhoApi);
  protected readonly standing = toSignal(toObservable(this.runnerId).pipe(
    switchMap(id => this.api.runnerStanding(id).pipe(
      catchError(() => of(null)),
      startWith(undefined),
    )),
  ));
}