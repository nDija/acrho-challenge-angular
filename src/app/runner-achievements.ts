import { OverlayModule } from '@angular/cdk/overlay';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi, type RunnerAchievement, type RunnerResult } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

// Includes hidden badges when an older API response omits the catalogue size.
const ACHIEVEMENT_CATALOG_SIZE = 37;

@Component({
  selector: 'app-runner-achievements',
  imports: [DatePipe, DecimalPipe, NgTemplateOutlet, MatButtonModule, OverlayModule, TranslatePipe],
  templateUrl: './runner-achievements.html',
  styleUrl: './runner-achievements.scss',
})
export class RunnerAchievements {
  private readonly api = inject(AcrhoApi);
  readonly i18n = inject(LanguageService);
  readonly runnerId = input.required<number>();
  readonly seasonId = input.required<number>();
  readonly year = input<number>();
  readonly results = input<RunnerResult[]>([]);
  readonly latestResult = computed(() => {
    const results = this.results();
    const latest = results.find(entry => ['FINISHED', 'DNF', 'DSQ'].includes(entry.result.status ?? ''));
    return latest ? results.find(entry => entry.raceId === latest.raceId && entry.result.status === 'FINISHED') ?? latest
      : undefined;
  });
  private readonly rankingRequest = computed(() => {
    const raceId = this.latestResult()?.raceId;
    const year = this.year();
    return raceId == null || year == null ? null : { runnerId: this.runnerId(), raceId, year };
  });
  private readonly rankingResponse = toSignal(toObservable(this.rankingRequest).pipe(
    switchMap(request => request === null ? of(null) : this.api.runnerRaceRankChange(
      request.runnerId, request.raceId, request.year,
    ).pipe(
      map(ranking => ({ request, ranking })),
      catchError(() => of({ request, ranking: null })),
    )),
  ));
  readonly rankChange = computed(() => {
    const response = this.rankingResponse();
    return response?.request === this.rankingRequest() ? response?.ranking : null;
  });
  private readonly refresh = signal(0);
  private readonly request = computed(() => ({
    runnerId: this.runnerId(), seasonId: this.seasonId(), refresh: this.refresh(),
  }));
  private readonly response = toSignal(toObservable(this.request).pipe(
    switchMap(request => this.api.runnerAchievements(request.runnerId, request.seasonId).pipe(
      map(response => {
        const items = response.body ?? [];
        return {
          request, status: 'ready' as const, items,
          total: Number(response.headers.get('X-Total-Count') ?? ACHIEVEMENT_CATALOG_SIZE),
        };
      }),
      catchError(() => of({ request, status: 'error' as const })),
      startWith({ request, status: 'loading' as const }),
    )),
  ));
  readonly state = computed(() => {
    const response = this.response();
    return response?.request === this.request() ? response : { status: 'loading' as const };
  });
  readonly expanded = signal(false);
  readonly total = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.total : null;
  });

  onAccordionToggle(open: boolean) {
    this.expanded.set(open);
    if (!open) this.closeBadge();
  }

  readonly unlocked = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.items.filter(item => item.unlocked) : [];
  });
  readonly recentBadges = computed(() => {
    const latest = this.latestResult();
    if (!latest) return [];
    const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Brussels' });
    return this.unlocked().filter(badge =>
      badge.unlockedAt && dateFormat.format(new Date(badge.unlockedAt)) >= latest.raceDate
    );
  });

  readonly nextBadges = computed(() => {
    const currentYear = new Date().getFullYear();
    if ((this.year() ?? currentYear) < currentYear) return [];

    const state = this.state();
    const firstByGroup = new Map<string, RunnerAchievement>();
    const individualBadges: RunnerAchievement[] = [];
    if (state.status === 'ready') {
      for (const item of state.items) {
        if (item.unlocked) continue;
        if (item.group === 'SEASON' || item.group === 'CLUB') individualBadges.push(item);
        else if (!firstByGroup.has(item.group)) firstByGroup.set(item.group, item);
      }
    }
    return [...firstByGroup.values(), ...individualBadges];
  });

  readonly activeBadge = signal<string | null>(null);
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.closeTimer));
  }

  showBadge(code: string) {
    clearTimeout(this.closeTimer);
    this.activeBadge.set(code);
  }

  previewBadge(event: PointerEvent, code: string) {
    if (event.pointerType === 'mouse') this.showBadge(code);
  }

  leaveBadge(event: PointerEvent, code: string) {
    if (event.pointerType === 'mouse') this.scheduleClose(code);
  }

  scheduleClose(code: string) {
    if (this.activeBadge() !== code) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => this.closeBadge(code), 160);
  }

  closeBadge(code = this.activeBadge()) {
    if (this.activeBadge() !== code) return;
    clearTimeout(this.closeTimer);
    this.activeBadge.set(null);
  }

  retry() {
    this.refresh.update(value => value + 1);
  }
}
