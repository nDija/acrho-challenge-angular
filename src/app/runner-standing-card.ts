import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-runner-standing-card',
  imports: [DecimalPipe, TitleCasePipe, TranslatePipe],
  host: { role: 'region' },
  template: `
    <ng-content />
    <div>
      <div class="heading">
        <h2 id="runner-standing-title">{{ 'CLASSEMENT' | t | titlecase }}</h2>
        @if (standing(); as data) { <span>{{ data.year }}</span> }
      </div>
      @if (standing(); as data) {
        @if (data.placement; as placement) {
          <dl [class.provisional]="placement.provisional">
            <div>
              <dt>{{ 'Général' | t }}</dt>
              <dd>{{ placement.overallRank ?? '—' }}</dd>
            </div>
            <div>
              <dt>{{ 'Catégorie' | t }} @if (placement.category) { ({{ placement.category }}) }</dt>
              <dd>{{ placement.categoryRank ?? '—' }}</dd>
            </div>
            <div>
              <dt>{{ 'Courses' | t }}</dt>
              <dd>{{ placement.participations ?? '—' }}</dd>
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
    </div>
  `,
  styles: `
    .heading { display: flex; align-items: baseline; gap: 6px; }
    h2 { margin: 0; color: var(--acrho-heading); font: 800 1rem Manrope, sans-serif; }
    .heading span, dt, p { color: var(--acrho-muted); font-size: 11px; }
    dl { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 4px 0 0; }
    dl > div { display: flex; flex-direction: column-reverse; }
    dd { margin: 0; font: 800 22px Manrope, sans-serif; font-variant-numeric: tabular-nums; }
    p { margin: 4px 0 0; }
    @media (max-width: 600px) {
      dd { font-size: 19px; }
      dt { font-size: 10px; }
    }
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