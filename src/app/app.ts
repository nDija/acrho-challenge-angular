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
  seasons: Season[] = []; selectedYear = new Date().getFullYear(); races: Race[] = []; seasonRaces: Race[] = [];
  showPlannedRaces = false; showCancelledRaces = false;
  selectedRace?: RaceDetail; categories: Category[] = []; results: Result[] = []; runners: Runner[] = [];
  expandedRaceId?: number; expandedRaceDetails?: RaceDetail; practicalInfoLoading = false;
  activeView: 'calendar' | 'runners' | 'regulation' = 'calendar'; loading = false; error = '';
  regulationHtml = ''; regulationLoading = false; regulationError = '';
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
  loadRaces() { const requestId = ++this.distanceRequestId; this.showPlannedRaces = false; this.showCancelledRaces = false; this.expandedRaceId = undefined; this.expandedRaceDetails = undefined; this.publishedDistanceKm = 0; this.distanceLoading = true; this.loading = true; this.error = ''; this.selectedRace = undefined; this.api.races(this.selectedYear).subscribe({ next: xs => { this.seasonRaces = xs; this.races = xs.filter(r => r.status?.toUpperCase() === 'PUBLISHED').sort((a,b) => a.raceDate.localeCompare(b.raceDate)); this.loadPublishedDistance(this.races, requestId); this.loading = false; this.cdr.markForCheck(); }, error: e => { this.loading = false; this.fail(e); this.cdr.markForCheck(); } }); }
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
  pacePerKm(result: Result): string | null {
    const distanceM = this.selectedRace?.routes.find(route => route.id === this.selectedRouteId)?.distanceM;
    if (!result.timeMs || !distanceM || distanceM <= 0) return null;
    const paceSeconds = Math.round(result.timeMs / distanceM);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = String(paceSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds} /km`;
  }
  get upcomingCount() { return this.seasonRaces.filter(r => r.status?.toUpperCase() === 'PLANNED').length; }
  get cancelledRaces() { return this.seasonRaces.filter(r => r.status?.toUpperCase() === 'CANCELLED').sort((a,b) => a.raceDate.localeCompare(b.raceDate)); }
  get plannedRaces() { return this.seasonRaces.filter(r => r.status?.toUpperCase() === 'PLANNED').sort((a,b) => a.raceDate.localeCompare(b.raceDate)); }
  get nextUpcomingRace() {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    return this.plannedRaces.find(race => race.raceDate >= localDate);
  }
  get displayedRaces() { return this.showPlannedRaces ? this.plannedRaces : this.showCancelledRaces ? this.cancelledRaces : this.races; }
  showPublishedRaces() { this.showPlannedRaces = false; this.showCancelledRaces = false; this.expandedRaceId = undefined; this.expandedRaceDetails = undefined; this.practicalInfoLoading = false; }
  togglePlannedRaces() { const show = !this.showPlannedRaces; this.showPlannedRaces = show; this.showCancelledRaces = false; this.expandedRaceId = undefined; this.expandedRaceDetails = undefined; }
  toggleCancelledRaces() { const show = !this.showCancelledRaces; this.showCancelledRaces = show; this.showPlannedRaces = false; this.expandedRaceId = undefined; this.expandedRaceDetails = undefined; }
  showNextRaceDetails() {
    const race = this.nextUpcomingRace;
    if (!race) return;
    this.showPlannedRaces = true;
    this.showCancelledRaces = false;
    this.expandedRaceId = undefined;
    this.expandedRaceDetails = undefined;
    this.togglePlannedDetails(race);
  }
  togglePlannedDetails(race: Race) {
    if (this.expandedRaceId === race.id) {
      this.expandedRaceId = undefined;
      this.expandedRaceDetails = undefined;
      this.practicalInfoLoading = false;
      return;
    }
    this.expandedRaceId = race.id;
    this.expandedRaceDetails = undefined;
    this.practicalInfoLoading = true;
    this.api.race(race.id).subscribe({
      next: detail => { if (this.expandedRaceId !== race.id) return; this.expandedRaceDetails = detail; this.practicalInfoLoading = false; this.cdr.markForCheck(); },
      error: e => { if (this.expandedRaceId !== race.id) return; this.practicalInfoLoading = false; this.fail(e); this.cdr.markForCheck(); }
    });
  }
  practicalSections(detail: RaceDetail) {
    const labels: Record<string, string> = {
      courseSummary: 'La course en quelques mots', directions: 'Pour arriver à bon port', parking: 'Parking',
      registration: 'Inscriptions', changingRoomsAndShowers: 'Vestiaires et douches',
      departureLocation: 'Départ', arrivalLocation: 'Arrivée', prizeGiving: 'Remise des prix',
      additionalInformation: 'Informations supplémentaires', contact: 'Contact', refreshments: 'Ravitaillements',
      otherSections: 'Autres informations'
    };
    return Object.entries(detail.practicalInfo?.details ?? {}).filter(([key]) => key !== 'route').map(([key, value]) => ({
      key, label: labels[key] ?? key, value: this.formatPracticalValue(value)
    })).filter(section => section.value.length > 0);
  }
  private formatPracticalValue(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(item => this.formatPracticalValue(item)).filter(Boolean).join('\n');
    if (value && typeof value === 'object') {
      const data = value as Record<string, unknown>;
      const lines: string[] = [];
      const consumed = new Set<string>();
      if (data['introduction'] !== undefined) {
        lines.push(this.formatPracticalValue(data['introduction']));
        consumed.add('introduction');
      }
      if (Array.isArray(data['items'])) {
        lines.push(...data['items'].map(item => `• ${this.formatPracticalValue(item)}`));
        consumed.add('items');
      }
      if (data['description'] !== undefined) {
        lines.push(this.formatPracticalValue(data['description']));
        consumed.add('description');
      }
      if (data['title'] !== undefined || data['content'] !== undefined) {
        lines.push([data['title'], data['content']].filter(Boolean).map(item => this.formatPracticalValue(item)).join(' : '));
        consumed.add('title');
        consumed.add('content');
      }
      for (const [key, item] of Object.entries(data)) {
        if (!consumed.has(key)) lines.push(`${this.humanizePracticalKey(key)} : ${this.formatPracticalValue(item)}`);
      }
      return lines.join('\n');
    }
    return '';
  }
  private humanizePracticalKey(key: string) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, first => first.toUpperCase()); }
  get practicalRoute() {
    const route = this.expandedRaceDetails?.practicalInfo?.details?.['route'];
    return route && typeof route === 'object' ? route as Record<string, unknown> : undefined;
  }
  get practicalRouteDescription() { return this.formatPracticalValue(this.practicalRoute?.['description']); }
  get openRunnerUrl() { const url = this.practicalRoute?.['openrunnerEmbedUrl']; return typeof url === 'string' ? url : undefined; }
  applyResultFilters() { if (!this.selectedRouteId) return; this.resultPage = 0; this.loadResults(this.selectedRouteId, 0); }
  clearResultFilters() { this.resultQuery = ''; this.category = ''; this.gender = ''; if (this.selectedRouteId) { this.resultPage = 0; this.loadResults(this.selectedRouteId, 0); } }
  onResultsPage(e: PageEvent) { this.resultSize = e.pageSize; if (this.selectedRouteId) this.loadResults(this.selectedRouteId, e.pageIndex); }
  onRunnerPage(e: PageEvent) { this.findRunners(e.pageIndex); }
  showRunners() { this.activeView = 'runners'; this.selectedRace = undefined; this.error = ''; }
  showRegulation() {
    this.activeView = 'regulation';
    this.selectedRace = undefined;
    this.error = '';
    if (this.regulationHtml || this.regulationLoading) return;
    this.regulationLoading = true;
    this.regulationError = '';
    this.api.regulation().subscribe({
      next: markdown => { this.regulationHtml = this.renderRegulationMarkdown(markdown); this.regulationLoading = false; this.cdr.markForCheck(); },
      error: () => { this.regulationError = 'Impossible de charger le règlement.'; this.regulationLoading = false; this.cdr.markForCheck(); }
    });
  }
  private renderRegulationMarkdown(markdown: string): string {
    const categoryLine = /^(ED|DA|A[1-4]|EH|SE|V[1-5])\s/;
    return markdown.replace(/\r/g, '').trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      if (lines.length === 1 && lines[0].startsWith('# ')) {
        return `<h1>${this.regulationInline(lines[0].slice(2))}</h1>`;
      }
      if (lines.every(line => categoryLine.test(line))) {
        return `<ul class="regulation-categories">${lines.map(line => `<li>${this.regulationInline(line)}</li>`).join('')}</ul>`;
      }
      if (lines[0].startsWith('**Conditions d’âge:**') || lines[0].startsWith("**Conditions d'âge:**")) {
        return `<h2>Conditions d’âge</h2><p>${lines.slice(1).map(line => this.regulationInline(line)).join('<br>')}</p>`;
      }
      if (lines.length === 1 && lines[0].startsWith('Formule de l’attribution des points:')) {
        return `<h2>${this.regulationInline(lines[0])}</h2>`;
      }
      if (lines.length === 1 && lines[0].startsWith('Points =')) {
        return `<div class="regulation-formula"><code>${this.regulationInline(lines[0])}</code></div>`;
      }
      return `<p>${lines.map(line => this.regulationInline(line)).join('<br>')}</p>`;
    }).join('');
  }
  private regulationInline(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  backToCalendar() { this.activeView = 'calendar'; this.selectedRace = undefined; this.error = ''; }
  private fail(e: HttpErrorResponse) { this.error = e.status === 0 ? 'Impossible de joindre l’API. Vérifie que le serveur ACRHO tourne sur localhost:8080.' : `Erreur API (${e.status}) : ${e.error?.message ?? e.message}`; }
}



























