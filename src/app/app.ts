import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, from, mergeMap, of, toArray } from 'rxjs';
import { AcrhoApi, Category, Race, RaceDetail, Result, Runner, Season } from './acrho-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-root', standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './app.html', styleUrl: './app.scss'
})
export class App implements OnInit {
  private api = inject(AcrhoApi);
  private cdr = inject(ChangeDetectorRef);
  seasons: Season[] = []; selectedYear = new Date().getFullYear(); races: Race[] = [];
  selectedRace?: RaceDetail; categories: Category[] = []; results: Result[] = []; runners: Runner[] = [];
  activeView: 'calendar' | 'runners' = 'calendar'; loading = false; error = '';
  runnerQuery = ''; resultQuery = ''; category = ''; gender = ''; showResultFilters = false;
  resultTotal = 0; resultPage = 0; resultSize = 20; selectedRouteId?: number; runnerTotal = 0; runnerPage = 0;
  private runnerSearchTimer?: ReturnType<typeof setTimeout>;
  private runnerRequestId = 0;
  private distanceRequestId = 0;
  publishedDistanceKm = 0;
  distanceLoading = false;
  ngOnInit() {
    this.api.seasons().subscribe({ next: xs => { this.seasons = xs; if (xs.length && !xs.some(s => s.year === this.selectedYear)) this.selectedYear = xs[0].year; this.loadRaces(); this.cdr.markForCheck(); }, error: e => this.fail(e) });
    this.api.categories().subscribe({ next: xs => { this.categories = xs; this.cdr.markForCheck(); }, error: () => {} });
  }
  loadRaces() { const requestId = ++this.distanceRequestId; this.publishedDistanceKm = 0; this.distanceLoading = true; this.loading = true; this.error = ''; this.selectedRace = undefined; this.api.races(this.selectedYear).subscribe({ next: xs => { this.races = xs.filter(r => r.status?.toUpperCase() === 'PUBLISHED').sort((a,b) => a.raceDate.localeCompare(b.raceDate)); this.loadPublishedDistance(this.races, requestId); this.loading = false; this.cdr.markForCheck(); }, error: e => { this.loading = false; this.fail(e); this.cdr.markForCheck(); } }); }
  private loadPublishedDistance(races: Race[], requestId: number) {
    if (!races.length) {
      this.distanceLoading = false;
      this.cdr.markForCheck();
      return;
    }
    from(races).pipe(
      mergeMap(race => this.api.race(race.id).pipe(catchError(() => of(null))), 5),
      toArray(),
    ).subscribe(details => {
      if (requestId !== this.distanceRequestId) return;
      const meters = details.flatMap(detail => detail?.routes ?? [])
        .reduce((total, route) => total + (route.distanceM ?? 0), 0);
      this.publishedDistanceKm = meters / 1000;
      this.distanceLoading = false;
      this.cdr.markForCheck();
    });
  }  openRace(r: Race) { this.loading = true; this.error = ''; this.api.race(r.id).subscribe({ next: x => { this.selectedRace = x; this.loading = false; this.results = []; this.resultPage = 0; this.selectedRouteId = undefined; if (x.routes?.length) this.loadResults(x.routes[0].id); this.cdr.markForCheck(); }, error: e => { this.loading = false; this.fail(e); this.cdr.markForCheck(); } }); }
  loadResults(routeId: number, page = 0) { this.selectedRouteId = routeId; this.loading = true; this.api.results(routeId, page, this.resultSize, this.resultQuery, this.category, this.gender).subscribe({ next: x => { this.results = x.content; this.resultTotal = x.total; this.resultPage = x.page; this.loading = false; this.cdr.markForCheck(); }, error: e => { this.loading = false; this.results = []; this.resultTotal = 0; if (e.status === 404) this.error = 'Les résultats ne sont pas publiés pour cette course.'; else this.fail(e); this.cdr.markForCheck(); } }); }
  onRunnerQueryChange() {
    if (this.runnerSearchTimer) clearTimeout(this.runnerSearchTimer);
    const query = this.runnerQuery.trim();
    if (query.length < 2) {
      this.runnerRequestId++;
      this.runners = [];
      this.runnerTotal = 0;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.runnerSearchTimer = setTimeout(() => this.findRunners(), 300);
  }
  findRunners(page = 0) { if (this.runnerSearchTimer) clearTimeout(this.runnerSearchTimer); const q = this.runnerQuery.trim(); if (q.length < 2) { this.runners = []; this.runnerTotal = 0; return; } this.activeView = 'runners'; this.loading = true; const requestId = ++this.runnerRequestId; this.api.runners(q, page).subscribe({ next: x => { if (requestId !== this.runnerRequestId) return; this.runners = x.content; this.runnerTotal = x.total; this.runnerPage = x.page; this.loading = false; this.cdr.markForCheck(); }, error: e => { if (requestId !== this.runnerRequestId) return; this.loading = false; this.fail(e); this.cdr.markForCheck(); } }); }
  get firstRace() { return this.races[0]; }
  get upcomingCount() { return this.races.filter(r => r.raceDate >= new Date().toISOString().slice(0,10)).length; }
  applyResultFilters() { if (!this.selectedRouteId) return; this.resultPage = 0; this.loadResults(this.selectedRouteId, 0); }
  clearResultFilters() { this.resultQuery = ''; this.category = ''; this.gender = ''; if (this.selectedRouteId) { this.resultPage = 0; this.loadResults(this.selectedRouteId, 0); } }
  onResultsPage(e: PageEvent) { this.resultSize = e.pageSize; if (this.selectedRouteId) this.loadResults(this.selectedRouteId, e.pageIndex); }
  onRunnerPage(e: PageEvent) { this.findRunners(e.pageIndex); }
  showRunners() { this.activeView = 'runners'; this.selectedRace = undefined; this.error = ''; }
  backToCalendar() { this.activeView = 'calendar'; this.selectedRace = undefined; this.error = ''; }
  private fail(e: HttpErrorResponse) { this.error = e.status === 0 ? 'Impossible de joindre l’API. Vérifie que le serveur ACRHO tourne sur localhost:8080.' : `Erreur API (${e.status}) : ${e.error?.message ?? e.message}`; }
}



























