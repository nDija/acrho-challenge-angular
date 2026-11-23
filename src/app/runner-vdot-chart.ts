import { DecimalPipe, DOCUMENT } from '@angular/common';
import { afterRenderEffect, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChartData, ChartOptions, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import { catchError, from, map, mergeMap, of, scan, startWith, switchMap } from 'rxjs';
import { AcrhoApi, RunnerResult, VdotPerformance } from './acrho-api.service';
import { RaceWeather, RaceWeatherService } from './race-weather.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

interface VdotPoint {
  x: number;
  y: number;
  race: VdotPerformance;
}

const day = 86_400_000;

@Component({
  selector: 'app-runner-vdot-chart',
  imports: [BaseChartDirective, DecimalPipe, MatButtonModule, MatIconModule, TranslatePipe],
  providers: [provideCharts({ registerables: [LineController, LineElement, LinearScale, PointElement, Tooltip] })],
  template: `
    <section aria-labelledby="runner-vdot-title">
      <div class="vdot-heading">
        <h2 id="runner-vdot-title">{{ 'VDOT de la saison' | t }} {{ year() }}</h2>
        <button mat-icon-button type="button" aria-controls="runner-vdot-explanation"
                [attr.aria-label]="'Qu’est-ce que le VDOT ?' | t"
                [attr.aria-expanded]="showExplanation()" (click)="showExplanation.set(!showExplanation())">
          <mat-icon aria-hidden="true">info_outline</mat-icon>
        </button>
      </div>
      <p id="runner-vdot-explanation" class="vdot-explanation" [hidden]="!showExplanation()">
        {{ 'Le VDOT estime ton niveau en course à pied à partir de la distance parcourue et de ton temps de course. Plus le score est élevé, meilleure est la performance estimée. Il permet de comparer des performances sur différentes distances et de suivre ton évolution au fil de la saison.' | t }}
      </p>
      @if (state(); as current) {
        @if (current.status === 'ready') {
          @if (current.data.statistics.validRaceCount) {
            <dl>
              <div><dt>{{ 'Meilleur VDOT' | t }}</dt><dd>{{ current.data.statistics.bestVdot | number:'1.0-2':i18n.locale() }}</dd></div>
              <div><dt>{{ 'Moyenne VDOT' | t }}</dt><dd>{{ current.data.statistics.averageVdot | number:'1.0-2':i18n.locale() }}</dd></div>
              <div><dt>{{ 'Évolution VDOT' | t }}</dt><dd>{{ current.data.statistics.evolution | number:'1.0-2':i18n.locale() }}</dd></div>
            </dl>
            <div class="plot">
              <canvas baseChart type="line" [data]="chartData()" [options]="chartOptions()"
                role="img" aria-labelledby="runner-vdot-title"></canvas>
            </div>
            @if (hasEstimate()) { <p>◆ {{ 'VDOT estimé' | t }}</p> }
            @if (weatherByRace().size) {
              <p>{{ 'Météo estimée par' | t }} <a href="https://open-meteo.com/">Open-Meteo</a></p>
            }
          } @else {
            <p role="status">{{ 'Aucun VDOT calculable pour cette saison.' | t }}</p>
          }
        } @else if (current.status === 'error') {
          <p role="alert">{{ 'Le VDOT est indisponible.' | t }}
            <button mat-button type="button" (click)="retryRequest()">{{ 'Réessayer' | t }}</button>
          </p>
        } @else {
          <p role="status">{{ 'Chargement du VDOT…' | t }}</p>
        }
      }
    </section>
  `,
  styles: `
    :host { display: block; }
    section { margin-top: 12px; padding: 16px; border: 1px solid var(--acrho-border); border-radius: 13px; background: var(--acrho-surface, #fff); color: var(--acrho-heading); }
    a { color: var(--acrho-accent-dark); }
    .vdot-heading { display: flex; align-items: center; gap: .25rem; }
    .vdot-explanation { padding: .75rem; margin: 0 0 .75rem; border-radius: .5rem; background: var(--acrho-soft); }
    h2 { margin: 0; color: var(--acrho-heading); font: 800 1rem Manrope, sans-serif; }
    dl { display: flex; flex-wrap: wrap; gap: 8px 24px; margin: 0 0 12px; }
    dt, p { color: var(--acrho-muted); font-size: .8rem; }
    dd { margin: 0; font-weight: 800; font-variant-numeric: tabular-nums; }
    p { margin: 6px 0 0; }
    .plot { position: relative; height: clamp(220px, 36vw, 320px); min-width: 0; }
  `,
})
export class RunnerVdotChart {
  readonly runnerId = input.required<number>();
  readonly seasonId = input.required<number>();
  readonly year = input.required<number | undefined>();
  readonly results = input.required<readonly RunnerResult[]>();
  protected readonly showExplanation = signal(false);
  private readonly retry = signal(0);
  protected readonly i18n = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly palette = signal({ accent: '#005cbb', text: '#304b68', grid: '#dce5ef', surface: '#fff' });
  private readonly api = inject(AcrhoApi);
  private readonly weatherService = inject(RaceWeatherService);
  private readonly request = computed(() => ({
    seasonId: this.seasonId(), runnerId: this.runnerId(), retry: this.retry(),
  }));
  private readonly response = toSignal(toObservable(this.request).pipe(
    switchMap(request => this.api.runnerVdot(request.runnerId, request.seasonId).pipe(
      map(data => ({ request, status: 'ready' as const, data })),
      catchError(() => of({ request, status: 'error' as const })),
    )),
  ));

  protected readonly state = computed(() => {
    const response = this.response();
    return response && response.request === this.request() ? response : { status: 'loading' as const };
  });
  constructor() {
    afterRenderEffect({ read: () => {
      this.i18n.language();
      this.i18n.theme();
      const style = this.document.defaultView?.getComputedStyle(this.document.documentElement);
      if (!style) return;
      this.palette.set({
        accent: style.getPropertyValue('--acrho-accent').trim(),
        text: style.getPropertyValue('--acrho-text').trim(),
        grid: style.getPropertyValue('--acrho-border').trim(),
        surface: style.getPropertyValue('--acrho-surface').trim() || '#fff',
      });
    } });
  }

  protected retryRequest() {
    this.retry.update(value => value + 1);
  }

  private readonly points = computed<VdotPoint[]>(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data.performances.flatMap(race =>
      race.vdot == null ? [] : [{ x: Date.parse(race.date) / day, y: race.vdot, race }],
    ) : [];
  });
  private readonly weatherRaces = computed(() => {
    const results = new Map(this.results().map(result => [result.raceId, result]));
    return [...new Set(this.points().map(point => point.race.raceId))]
      .flatMap(raceId => {
        const result = results.get(raceId);
        const city = result?.city?.trim();
        return result && city ? [{ raceId, city, date: result.raceDate }] : [];
      });
  });
  protected readonly weatherByRace = toSignal(toObservable(this.weatherRaces).pipe(
    switchMap(races => {
      const empty = new Map<number, RaceWeather>();
      return from(races).pipe(
        mergeMap(race => this.weatherService.forRace(race.city, race.date).pipe(
          map(weather => ({ raceId: race.raceId, weather })),
        ), 3),
        scan((values, { raceId, weather }) => weather ? new Map(values).set(raceId, weather) : values, empty),
        startWith(empty),
      );
    }),
  ), { initialValue: new Map<number, RaceWeather>() });

  protected readonly hasEstimate = computed(() => this.points().some(point => point.race.reliability === 'ESTIMATED'));
  protected readonly chartData = computed<ChartData<'line', VdotPoint[]>>(() => ({
    datasets: [{
      data: this.points(),
      borderColor: this.palette().accent,
      backgroundColor: this.palette().accent,
      pointBorderColor: this.palette().surface,
      pointStyle: this.points().map(point => point.race.reliability === 'ESTIMATED' ? 'rectRot' : 'circle'),
      pointRadius: 5,
      pointHoverRadius: 7,
      pointHitRadius: 8,
    }],
  }));
  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    const locale = this.i18n.locale();
    const { text, grid, surface } = this.palette();
    const scaleColors = { grid: { color: grid }, border: { color: grid } };
    const tickDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const raceDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const weatherByRace = this.weatherByRace();
    const firstDay = this.points()[0]?.x;
    const lastDay = this.points().at(-1)?.x;
    const state = this.state();
    const firstCalendarRace = state.status === 'ready' ? state.data.firstCalendarRaceDate : null;
    const calendarStart = firstCalendarRace ? Date.parse(firstCalendarRace) / day - 1 : undefined;
    const sameDay = firstDay != null && firstDay === lastDay;
    return {
      locale,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          min: calendarStart,
          suggestedMin: calendarStart === undefined ? (sameDay ? firstDay - 1 : firstDay) : undefined,
          suggestedMax: calendarStart === undefined
            ? (sameDay ? firstDay + 1 : lastDay)
            : Math.max(calendarStart + 1, lastDay ?? calendarStart),
          ...scaleColors,
          ticks: { color: text, precision: 0, maxTicksLimit: 7, callback: value => tickDate.format(Number(value) * day) },
        },
        y: { ...scaleColors, ticks: { color: text }, title: { display: true, text: 'VDOT', color: text } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: surface,
          titleColor: text,
          bodyColor: text,
          borderColor: grid,
          borderWidth: 1,
          callbacks: {
            title: items => (items[0]?.raw as VdotPoint | undefined)?.race.raceName ?? '',
            label: ({ raw }) => {
              const { race, x, y } = raw as VdotPoint;
              const seconds = Math.floor(race.durationSeconds ?? 0);
              const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
              const label = race.reliability === 'ESTIMATED' ? this.i18n.t('VDOT estimé') : 'VDOT';
              return [raceDate.format(x * day), `${number.format(race.distanceMeters / 1000)} km · ${time}`,
                `${label} · ${number.format(y)}`];
            },
            afterLabel: ({ raw }) => {
              const weather = weatherByRace.get((raw as VdotPoint).race.raceId);
              if (!weather) return [];
              return [
                `${this.i18n.t('Température moyenne')} · ${number.format(weather.temperature)} °C`,
                `${this.i18n.t('Précipitations')} · ${number.format(weather.precipitation)} mm`,
                `${this.i18n.t('Vent maximal')} · ${number.format(weather.wind)} km/h`,
              ];
            },
          },
        },
      },
    };
  });
}
