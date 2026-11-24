import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { catchError, map, of, startWith, switchMap, type Observable } from 'rxjs';
import { AcrhoApi, type ImportReport } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

type LoadState<T> =
  | { status: 'loading' | 'error' }
  | { status: 'ready'; data: T };

@Component({
  selector: 'app-import-administration',
  imports: [DatePipe, FormsModule, MatButtonModule, TranslatePipe],
  templateUrl: './import-administration.html',
  styleUrls: ['./admin-race-list.scss', './import-administration.scss'],
})
export class ImportAdministration {
  private readonly api = inject(AcrhoApi);
  readonly i18n = inject(LanguageService);
  private readonly selectedSeason = signal<number | null>(null);
  readonly selectedRace = signal<number | null>(null);
  readonly reviewing = signal(false);
  readonly showReviewed = signal(false);
  readonly clubIssue = signal<number | null>(null);
  readonly clubChoice = signal('');
  readonly clubName = signal('');
  readonly clubToSave = computed(() => this.clubChoice() || this.clubName().trim());
  readonly clubSuggestions = toSignal(toObservable(this.clubIssue).pipe(
    switchMap(id => id === null ? of(null) : this.api.importClubSuggestions(id).pipe(
      map((data): LoadState<string[]> => ({ status: 'ready', data })),
      catchError(() => of<LoadState<string[]>>({ status: 'error' })),
      startWith<LoadState<string[]>>({ status: 'loading' }),
    )),
  ));
  readonly reviewFeedback = signal<'success' | 'error' | null>(null);
  private readonly reviewedIssues = signal<ReadonlySet<number>>(new Set());

  readonly seasons = toSignal(this.api.importReportSeasons().pipe(
    map((data): LoadState<number[]> => ({ status: 'ready', data })),
    catchError(() => of<LoadState<number[]>>({ status: 'error' })),
  ), { initialValue: { status: 'loading' } as LoadState<number[]> });

  readonly season = computed(() => {
    const state = this.seasons();
    return state.status === 'ready' ? this.selectedSeason() ?? state.data[0] ?? null : null;
  });

  readonly reports = toSignal(toObservable(this.season).pipe(
    switchMap(year => year === null ? of<LoadState<ImportReport[]>>({ status: 'loading' }) :
      this.api.importReports(year).pipe(
        map((data): LoadState<ImportReport[]> => ({ status: 'ready', data })),
        catchError(() => of<LoadState<ImportReport[]>>({ status: 'error' })),
        startWith<LoadState<ImportReport[]>>({ status: 'loading' }),
      )),
  ), { initialValue: { status: 'loading' } as LoadState<ImportReport[]> });

  readonly races = computed(() => {
    const state = this.reports();
    const races = new Map<number, ImportReport>();
    if (state.status === 'ready') {
      for (const report of state.data) {
        const race = races.get(report.legacyRunId);
        if (!race || (!race.runName && report.runName)) races.set(report.legacyRunId, report);
      }
    }
    return [...races.values()].sort((a, b) =>
      (b.runDate ?? '').localeCompare(a.runDate ?? '') ||
      this.raceLabel(a).localeCompare(this.raceLabel(b), this.i18n.locale()));
  });

  readonly raceCards = computed(() => {
    const state = this.reports();
    const selectedRace = this.selectedRace();
    const reviewed = this.reviewedIssues();
    const showReviewed = this.showReviewed();
    if (state.status !== 'ready') return [];

    const errorsByRace = new Map<number, { report: ImportReport; issue: ImportReport['issues'][number] | null }[]>();
    for (const report of state.data) {
      if (selectedRace !== null && report.legacyRunId !== selectedRace) continue;
      const errors = errorsByRace.get(report.legacyRunId) ?? [];
      if (report.status === 'FAILED' || report.error) errors.push({ report, issue: null });
      for (const issue of report.issues) {
        const isReviewed = issue.reviewed || reviewed.has(issue.id);
        if (showReviewed || !isReviewed) errors.push({ report, issue: { ...issue, reviewed: isReviewed } });
      }
      if (errors.length) errorsByRace.set(report.legacyRunId, errors);
    }

    return this.races().flatMap(race => {
      const errors = errorsByRace.get(race.legacyRunId);
      return errors ? [{ race, errors }] : [];
    });
  });

  openClubCorrection(id: number) {
    this.clubChoice.set('');
    this.clubName.set('');
    this.reviewFeedback.set(null);
    this.clubIssue.set(id);
  }

  saveClubCorrection(id: number) {
    const name = this.clubToSave();
    if (name && name.length <= 150) {
      this.saveIssue(id, this.api.correctImportClub(id, name));
    }
  }

  reviewIssue(id: number, action: 'MODIFY' | 'MODIFY_CATEGORY' | 'REVIEW') {
    this.saveIssue(id, this.api.reviewImportIssue(id, action));
  }

  private saveIssue(id: number, request: Observable<void>) {
    if (this.reviewing()) return;
    this.reviewing.set(true);
    this.reviewFeedback.set(null);
    request.subscribe({
      next: () => {
        this.reviewedIssues.update(issues => new Set([...issues, id]));
        if (this.clubIssue() === id) this.clubIssue.set(null);
        this.reviewFeedback.set('success');
        this.reviewing.set(false);
      },
      error: () => {
        this.reviewFeedback.set('error');
        this.reviewing.set(false);
      },
    });
  }

  selectSeason(year: number) {
    this.reviewFeedback.set(null);
    this.clubIssue.set(null);
    this.selectedRace.set(null);
    this.selectedSeason.set(year);
  }

  raceLabel(report: ImportReport) {
    return report.runName || this.i18n.t('Course') + ' #' + report.legacyRunId;
  }
}
