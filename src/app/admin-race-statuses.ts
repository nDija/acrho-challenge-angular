import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { catchError, finalize, map, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi, type AdminRace, type RaceStatus } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

type StatusChoice = RaceStatus | 'AUTOMATIC';

@Component({
  selector: 'app-admin-race-statuses',
  imports: [DatePipe, FormsModule, MatButtonModule, TranslatePipe],
  templateUrl: './admin-race-statuses.html',
  styleUrl: './admin-race-statuses.scss',
})
export class AdminRaceStatuses {
  private readonly api = inject(AcrhoApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly i18n = inject(LanguageService);
  readonly statuses: readonly RaceStatus[] = ['PLANNED', 'RESULTS_RECEIVED', 'PUBLISHED', 'CANCELLED'];
  readonly statusLabels: Record<RaceStatus, string> = {
    PLANNED: 'Au calendrier',
    RESULTS_RECEIVED: 'Résultats reçus',
    PUBLISHED: 'Publiée',
    CANCELLED: 'Annulée',
  };

  readonly statusChanged = output<number>();
  readonly year = signal<number | null>(null);
  readonly saving = signal<number | null>(null);
  readonly notice = signal<{ raceId: number; success: boolean } | null>(null);
  private readonly updated = signal<Record<number, AdminRace>>({});
  private readonly drafts = signal<Partial<Record<number, StatusChoice>>>({});

  readonly seasons = toSignal(this.api.seasons().pipe(
    map(seasons => [...seasons].sort((a, b) => b.year - a.year)),
    catchError(() => of(null)),
  ));

  readonly selectedYear = computed(() => this.year() ?? this.seasons()?.[0]?.year ?? null);
  readonly raceList = toSignal(toObservable(this.selectedYear).pipe(
    switchMap(year => year === null ? of([]) : this.api.adminRaces(year).pipe(
      catchError(() => of(null)),
      startWith(undefined),
    )),
  ));

  selectYear(year: number) {
    this.updated.set({});
    this.drafts.set({});
    this.notice.set(null);
    this.year.set(year);
  }

  currentRace(race: AdminRace) {
    return this.updated()[race.id] ?? race;
  }

  choice(race: AdminRace) {
    return this.drafts()[race.id] ?? race.status;
  }

  canSave(race: AdminRace) {
    const choice = this.choice(race);
    return this.saving() === null &&
      (choice === 'AUTOMATIC' ? race.statusManuallySet : choice !== race.status);
  }

  selectStatus(id: number, choice: StatusChoice) {
    this.drafts.update(drafts => ({ ...drafts, [id]: choice }));
    this.notice.set(null);
  }

  save(race: AdminRace) {
    const choice = this.choice(race);
    const year = this.selectedYear();
    if (year === null || !this.canSave(race)) return;
    this.saving.set(race.id);
    this.notice.set(null);
    this.api.updateRaceStatus(race.id, choice).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(null)),
    ).subscribe({
      next: updated => {
        this.updated.update(races => ({ ...races, [updated.id]: updated }));
        this.drafts.update(drafts => ({ ...drafts, [updated.id]: undefined }));
        this.notice.set({ raceId: updated.id, success: true });
        this.statusChanged.emit(year);
      },
      error: () => this.notice.set({ raceId: race.id, success: false }),
    });
  }
}
