import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { AcrhoApi, type RaceBoostState } from './acrho-api.service';
import { TranslatePipe } from './translate.pipe';

type BoostTarget = { raceId: number; senderId: number };

@Component({
  selector: 'app-race-boosts',
  exportAs: 'raceBoosts',
  imports: [TranslatePipe],
  template: `
    @if (state(); as boosts) {
      <p class="quota" role="status">
        {{ 'Boosts envoyés' | t }} {{ boosts.sentTo.length }} / {{ boosts.limit }}
        · {{ 'Places restantes' | t }} {{ boosts.limit - boosts.sentTo.length }}
      </p>
    }
    @if (loadFailed() || saveFailed()) {
      <p class="error-banner" role="alert">{{ 'Impossible de mettre à jour les Boosts.' | t }}</p>
    }
    <ng-content></ng-content>
  `,
  styles: ['.quota { color: var(--acrho-heading); font-weight: 600; }'],
})
export class RaceBoosts {
  private readonly api = inject(AcrhoApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly raceId = input.required<number | null>();
  readonly senderId = input.required<number | null>();
  private readonly target = computed<BoostTarget | null>(() => {
    const raceId = this.raceId();
    const senderId = this.senderId();
    return raceId !== null && senderId !== null ? { raceId, senderId } : null;
  });
  private readonly loaded = toSignal(toObservable(this.target).pipe(
    switchMap(target => target === null ? of(null) : this.api.raceBoosts(target.raceId).pipe(
      map(state => ({ target, state })),
      catchError(() => of({ target, state: null })),
    )),
  ));
  private readonly updated = signal<{ target: BoostTarget; state: RaceBoostState } | null>(null);
  private readonly failedTarget = signal<BoostTarget | null>(null);
  readonly saving = signal(false);
  readonly saveFailed = computed(() => this.failedTarget() !== null && this.failedTarget() === this.target());
  readonly loadFailed = computed(() => {
    const loaded = this.loaded();
    return loaded?.target === this.target() && loaded?.state === null;
  });
  readonly state = computed(() => {
    const target = this.target();
    const updated = this.updated();
    if (updated && updated.target === target) return updated.state;
    const loaded = this.loaded();
    return loaded?.target === target ? loaded.state : null;
  });
  private readonly received = computed(() =>
    new Map(this.state()?.participants.map(p => [p.runnerId, p.received])));

  receivedBy(runnerId: number) {
    return this.received().get(runnerId);
  }

  hasBoosted(runnerId: number) {
    return this.state()?.sentTo.includes(runnerId) ?? false;
  }

  canToggle(runnerId: number) {
    const state = this.state();
    return !!state && !this.saving() && runnerId !== this.senderId() &&
      (state.sentTo.includes(runnerId) || (this.received().has(runnerId) && state.sentTo.length < state.limit));
  }

  toggle(runnerId: number) {
    const target = this.target();
    if (!target || !this.canToggle(runnerId)) return;
    this.saving.set(true);
    this.failedTarget.set(null);
    this.api.toggleRaceBoost(target.raceId, runnerId, !this.hasBoosted(runnerId)).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: state => this.updated.set({ target, state }),
      error: () => this.failedTarget.set(target),
    });
  }
}
