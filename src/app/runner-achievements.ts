import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi, type RunnerAchievement } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-runner-achievements',
  imports: [DecimalPipe, MatButtonModule, TranslatePipe],
  templateUrl: './runner-achievements.html',
  styleUrl: './runner-achievements.scss',
})
export class RunnerAchievements {
  private readonly api = inject(AcrhoApi);
  readonly i18n = inject(LanguageService);
  readonly runnerId = input.required<number>();
  readonly seasonId = input.required<number>();
  readonly year = input<number>();
  private readonly refresh = signal(0);
  private readonly request = computed(() => ({
    runnerId: this.runnerId(), seasonId: this.seasonId(), refresh: this.refresh(),
  }));
  private readonly response = toSignal(toObservable(this.request).pipe(
    switchMap(request => this.api.runnerAchievements(request.runnerId, request.seasonId).pipe(
      map(items => ({ request, status: 'ready' as const, items })),
      catchError(() => of({ request, status: 'error' as const })),
      startWith({ request, status: 'loading' as const }),
    )),
  ));
  readonly state = computed(() => {
    const response = this.response();
    return response?.request === this.request() ? response : { status: 'loading' as const };
  });
  readonly unlocked = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.items.filter(item => item.unlocked) : [];
  });
  readonly nextBadges = computed(() => {
    const state = this.state();
    const firstByGroup = new Map<string, RunnerAchievement>();
    const finalPlacements: RunnerAchievement[] = [];
    if (state.status === 'ready') {
      for (const item of state.items) {
        if (item.unlocked) continue;
        if (item.group === 'SEASON') finalPlacements.push(item);
        else if (!firstByGroup.has(item.group)) firstByGroup.set(item.group, item);
      }
    }
    return [...firstByGroup.values(), ...finalPlacements];
  });

  retry() {
    this.refresh.update(value => value + 1);
  }
}
