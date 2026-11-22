import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
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
  styleUrl: './import-administration.scss',
})
export class ImportAdministration {
  private readonly api = inject(AcrhoApi);
  readonly i18n = inject(LanguageService);
  private readonly selectedSeason = signal<number | null>(null);
  readonly selectedRace = signal<number | null>(null);
  readonly reviewing = signal(false);
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

  readonly visibleReports = computed(() => {
    const state = this.reports();
    const race = this.selectedRace();
    const reviewed = this.reviewedIssues();
    return state.status === 'ready' ? state.data
      .filter(report => race === null || report.legacyRunId === race)
      .map(report => ({ ...report, issues: report.issues.filter(issue => !reviewed.has(issue.id)) }))
      .filter(report => report.status === 'FAILED' || report.error || report.issues.length > 0) : [];
  });

  reviewIssue(id: number, action: 'MODIFY' | 'MODIFY_CATEGORY' | 'REVIEW') {
    if (this.reviewing()) return;
    this.reviewing.set(true);
    this.reviewFeedback.set(null);
    this.api.reviewImportIssue(id, action).subscribe({
      next: () => {
        this.reviewedIssues.update(issues => new Set([...issues, id]));
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
    this.selectedRace.set(null);
    this.selectedSeason.set(year);
  }

  raceLabel(report: ImportReport) {
    return report.runName || this.i18n.t('Course') + ' #' + report.legacyRunId;
  }
}
