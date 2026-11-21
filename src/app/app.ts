import { Photos } from './photos';
import { Sponsors } from './sponsors';
import { RaceWeather } from './race-weather';
import { LanguageService } from './language.service';
import { RunnerStandingCard } from './runner-standing-card';
import { RankedRunnerAvatar } from './ranked-runner-avatar';
import { RunnerVdotChart } from './runner-vdot-chart';
import { Standings } from './standings';
import { TranslatePipe } from './translate.pipe';
import { ClubNamePipe } from './club-name.pipe';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, forkJoin, from, mergeMap, of, switchMap, timer, timeout, toArray } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcrhoApi, Category, Me, Page, Race, RaceDetail, RacePhoto, Result, RouteInfo, Runner, RunnerResult, Season } from './acrho-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-root', standalone: true,
  imports: [Photos, Sponsors, RaceWeather, RankedRunnerAvatar, RunnerStandingCard, RunnerVdotChart, Standings, TranslatePipe, ClubNamePipe, CommonModule, FormsModule, MatButtonModule, MatIconModule, MatMenuModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './app.html', styleUrl: './app.scss'
})
export class App implements OnInit {
  readonly i18n = inject(LanguageService);
  private api = inject(AcrhoApi);
  private cdr = inject(ChangeDetectorRef);
  apiOnline = false;
  private healthCheck = timer(0, 30000).pipe(
    switchMap(() => this.api.health().pipe(timeout(10000), catchError(() => of(null)))),
    takeUntilDestroyed(),
  ).subscribe(health => {
    this.apiOnline = health?.status === 'UP';
    this.cdr.markForCheck();
  });
  me?: Me; authChecked = false; avatarFailed = false;
  seasons: Season[] = []; selectedYear = new Date().getFullYear(); races: Race[] = []; seasonRaces: Race[] = [];
  showPlannedRaces = false; showCancelledRaces = false;
  nextUpcomingRaceRoutes: RouteInfo[] = [];
  selectedRace?: RaceDetail; categories: Category[] = []; results: Result[] = []; runners: Runner[] = [];
  racePhoto?: Observable<RacePhoto | null>;
  racePhotoLoaded?: string;
  expandedRaceId?: number; expandedRaceDetails?: RaceDetail; practicalInfoLoading = false;
  mobileMenuOpen = false;
  activeView: 'calendar' | 'runners' | 'regulation' | 'settings' | 'favorites' | 'standings' | 'sponsors' | 'photos' = 'calendar'; loading = false; error = '';
  confirmAccountDeletion = false;
  deletingAccount = false;
  accountError = '';
  favorites: Runner[] = [];
  favoriteSuggestions?: Page<Runner>;
  private favoriteSuggestionsRequestId = 0;
  favoriteSuggestionsError = false;
  favoritesLoading = false;
  favoritesError = '';
  savingFavorites = new Set<number>();
  private favoritesRequestId = 0;
  readonly bannerColors = [
    { value: 'blue', label: 'Bleu', color: '#164e82' },
    { value: 'teal', label: 'Turquoise', color: '#115e59' },
    { value: 'green', label: 'Vert', color: '#166534' },
    { value: 'purple', label: 'Violet', color: '#6b21a8' },
    { value: 'rose', label: 'Rose', color: '#9d174d' },
    { value: 'slate', label: 'Ardoise', color: '#334155' },
    { value: 'black', label: 'Noir', color: '#111111' },
    { value: 'yellow', label: 'Jaune', color: '#facc15' },
    { value: 'orange', label: 'Orange', color: '#fb923c' },
    { value: 'sky', label: 'Bleu ciel', color: '#7dd3fc' },
    { value: 'gold', label: 'Or', color: '#d4a72c' },
    { value: 'red', label: 'Rouge', color: '#991b1b' },
    { value: 'silver', label: 'Argent', color: '#cbd5e1' },
    { value: 'bronze', label: 'Bronze', color: '#794625' },
  ];
  bannerSaving = false;
  bannerError = '';
  failedRunnerPictures = new Set<string>();
  linkedRunner?: Runner;
  openingLinkedRunner = false;
  suggestedRunners: Runner[] = [];
  accountRunnerQuery = '';
  runnerLinkLoading = false;
  runnerLinkSaving = false;
  runnerLinkError = '';
  runnerLinkMessage = '';
  private runnerLinkRequestId = 0;
  regulationHtml = ''; regulationLoading = false; regulationError = '';
  selectedRunner?: Runner;
  runnerYear?: number;
  showRunnerVdot = false;

  get runnerVdotSeasonId(): number | undefined {
    return this.seasons.find(season => season.year === this.runnerYear)?.id;
  }

  get runnerBannerColor(): string {
    return this.bannerColors.find(option => option.value === this.selectedRunner?.bannerColor)?.color
      ?? this.bannerColors[0].color;
  }

  runnerSeasons: number[] = [];
  runnerResults: RunnerResult[] = [];
  runnerDetailLoading = false;
  runnerDetailError = '';
  private runnerDetailRequestId = 0;
  runnerQuery = ''; resultQuery = ''; category = ''; gender = ''; showResultFilters = false;
  resultTotal = 0; resultPage = 0; resultSize = 20; selectedRouteId?: number; runnerTotal = 0; runnerPage = 0;
  private runnerSearchTimer?: ReturnType<typeof setTimeout>;
  private runnerRequestId = 0;
  private seasonRequestId = 0;
  publishedDistanceKm = 0;
  participantCount?: number;
  distanceLoading = false;
  ngOnInit() {
    this.loadMe();
    this.api.seasons().subscribe({ next: xs => { this.seasons = xs; if (xs.length && !xs.some(s => s.year === this.selectedYear)) this.selectedYear = xs[0].year; this.loadRaces(); this.cdr.markForCheck(); }, error: e => this.fail(e) });
    this.api.categories().subscribe({ next: xs => { this.categories = xs; this.cdr.markForCheck(); }, error: () => {} });
  }
  loadRaces() {
    const year = this.selectedYear;
    const requestId = ++this.seasonRequestId;
    this.showPlannedRaces = false;
    this.showCancelledRaces = false;
    this.expandedRaceId = undefined;
    this.expandedRaceDetails = undefined;
    this.nextUpcomingRaceRoutes = [];
    this.publishedDistanceKm = 0;
    this.participantCount = undefined;
    this.distanceLoading = true;
    this.loading = true;
    this.error = '';
    this.selectedRace = undefined;

    this.api.races(year).subscribe({
      next: races => {
        if (requestId !== this.seasonRequestId) return;
        this.seasonRaces = races;
        this.races = races.filter(race => race.status?.toUpperCase() === 'PUBLISHED')
          .sort((a, b) => b.raceDate.localeCompare(a.raceDate));
        this.loadNextUpcomingRaceRoutes();
        this.loadPublishedDistance(this.races, requestId);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        if (requestId !== this.seasonRequestId) return;
        this.loading = false;
        this.fail(error);
        this.cdr.markForCheck();
      },
    });

    this.api.participantCount(year).pipe(catchError(() => of(undefined))).subscribe(count => {
      if (requestId !== this.seasonRequestId) return;
      this.participantCount = count;
      this.cdr.markForCheck();
    });
  }
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
      if (requestId !== this.seasonRequestId) return;
      const meters = details.flatMap(detail => detail?.routes ?? [])
        .reduce((total, route) => total + (route.distanceM ?? 0), 0);
      this.publishedDistanceKm = meters / 1000;
      this.distanceLoading = false;
      this.cdr.markForCheck();
    });
  }  openRace(r: Race) { this.loading = true; this.error = ''; this.api.race(r.id).subscribe({ next: x => { this.selectedRace = x; this.racePhotoLoaded = undefined; this.racePhoto = x.city ? this.api.racePhoto(x.id).pipe(catchError(() => of(null))) : undefined; this.loading = false; this.results = []; this.resultPage = 0; this.selectedRouteId = undefined; if (x.routes?.length) this.loadResults(x.routes[0].id); this.cdr.markForCheck(); }, error: e => { this.loading = false; this.fail(e); this.cdr.markForCheck(); } }); }
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
    if (!this.me) return;
    this.runnerSearchTimer = setTimeout(() => this.findRunners(), 300);
  }
  findRunners(page = 0) { if (this.runnerSearchTimer) clearTimeout(this.runnerSearchTimer); if (!this.me) return; const q = this.runnerQuery.trim(); if (q.length < 2) { this.runners = []; this.runnerTotal = 0; return; } this.activeView = 'runners'; this.loading = true; const requestId = ++this.runnerRequestId; this.api.runners(q, page).subscribe({ next: x => { if (requestId !== this.runnerRequestId) return; this.runners = x.content; this.runnerTotal = x.total; this.runnerPage = x.page; this.loading = false; this.cdr.markForCheck(); }, error: e => { if (requestId !== this.runnerRequestId) return; this.loading = false; this.fail(e); this.cdr.markForCheck(); } }); }
  get firstRace() { return this.races[0]; }
  displayTime(time?: string | null): string {
    if (!time) return '—';
    return time.replace(/^00:(?=\d{2}:\d{2})/, '').replace(/^0([1-9]):(?=\d{2}:\d{2})/, '$1:').replace(/[.,]0+$/, '');
  }
  pacePerKm(result: Result, distanceM = this.selectedRace?.routes.find(route => route.id === this.selectedRouteId)?.distanceM): string | null {
    if (!result.timeMs || result.timeMs <= 0 || !distanceM || distanceM <= 0) return null;
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
  private loadNextUpcomingRaceRoutes() {
    const race = this.nextUpcomingRace;
    if (!race) return;
    this.api.race(race.id).subscribe({
      next: detail => {
        if (this.nextUpcomingRace?.id !== race.id) return;
        this.nextUpcomingRaceRoutes = detail.routes;
        this.cdr.markForCheck();
      },
      error: () => { /* Keep the card usable if this optional detail is unavailable. */ }
    });
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
  showPhotos() {
    this.closeRunner();
    this.selectedRace = undefined;
    this.activeView = 'photos';
  }

  showSponsors() {
    this.closeRunner();
    this.selectedRace = undefined;
    this.activeView = 'sponsors';
  }

  showStandings() {
    this.closeRunner();
    this.selectedRace = undefined;
    this.activeView = 'standings';
  }
  showRunners() { this.closeRunner(); this.activeView = 'runners'; this.selectedRace = undefined; this.error = ''; }
  categoryLabel(code?: string | null): string {
    if (!code) return '—';
    return this.i18n.t(this.categories.find(category => category.code === code)?.label ?? code);
  }
  changeBanner(color: string) {
    if (!this.me || !this.linkedRunner || this.me.runnerId !== this.linkedRunner.id || this.bannerSaving || this.runnerLinkSaving || this.deletingAccount) return;
    const runnerId = this.linkedRunner.id;
    const userId = this.me.id;
    this.bannerSaving = true;
    this.bannerError = '';
    this.api.changeBanner(color).subscribe({
      next: () => {
        this.bannerSaving = false;
        if (this.me?.id !== userId) return;
        if (this.linkedRunner?.id === runnerId) this.linkedRunner = { ...this.linkedRunner, bannerColor: color };
        if (this.selectedRunner?.id === runnerId) this.selectedRunner = { ...this.selectedRunner, bannerColor: color };
        this.runners = this.runners.map(runner => runner.id === runnerId ? { ...runner, bannerColor: color } : runner);
        this.favorites = this.favorites.map(runner => runner.id === runnerId ? { ...runner, bannerColor: color } : runner);
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.bannerSaving = false;
        if (this.me?.id !== userId) return;
        this.bannerError = 'Impossible de changer la couleur de la bannière.';
        if (error.status === 401) this.fail(error);
        this.cdr.markForCheck();
      },
    });
  }
  get runnerDistanceKm() {
    return this.runnerResults
      .filter(entry => entry.result.status === 'FINISHED')
      .reduce((meters, entry) => meters + (entry.distanceM ?? 0), 0) / 1000;
  }
  openRunnerFromResult(result: Result) {
    const year = this.seasons.find(season => season.id === this.selectedRace?.seasonId)?.year ?? this.selectedYear;
    this.openRunner(result.runner, year);
  }
  openRunner(runner: Runner, year?: number) {
    this.activeView = 'runners';
    this.selectedRace = undefined;
    this.error = '';
    this.selectedRunner = runner;
    this.showRunnerVdot = false;
    this.bannerError = '';
    this.runnerYear = year;
    this.runnerSeasons = [];
    this.loadRunnerResults();
  }
  closeRunner() {
    this.runnerDetailRequestId++;
    this.selectedRunner = undefined;
    this.runnerSeasons = [];
    this.runnerYear = undefined;
    this.runnerResults = [];
    this.runnerDetailLoading = false;
    this.runnerDetailError = '';
  }
  loadRunnerResults() {
    if (!this.selectedRunner || !this.me) return;
    const requestId = ++this.runnerDetailRequestId;
    this.runnerDetailLoading = true;
    this.runnerDetailError = '';
    this.runnerResults = [];
    forkJoin({
      runner: this.api.runner(this.selectedRunner.id),
      years: this.api.runnerSeasons(this.selectedRunner.id),
    }).pipe(
      switchMap(({ runner, years }) => {
        const year = years.find(year => year === this.runnerYear) ?? years[0];
        return forkJoin({
          runner: of(runner), years: of(years), year: of(year),
          results: year === undefined ? of([] as RunnerResult[]) : this.api.runnerResults(runner.id, year),
        });
      }),
    ).subscribe({
      next: ({ runner, results, years, year }) => {
        if (requestId !== this.runnerDetailRequestId) return;
        this.selectedRunner = runner;
        this.runnerSeasons = years;
        this.runnerYear = year;
        this.runnerResults = results;
        this.runnerDetailLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.runnerDetailRequestId) return;
        this.runnerDetailLoading = false;
        this.runnerDetailError = 'Impossible de charger les résultats de ce coureur.';
        if (error.status === 401) { this.closeRunner(); this.fail(error); }
        this.cdr.markForCheck();
      },
    });
  }
  changeLanguage(language: string) {
    this.i18n.setLanguage(language);
    this.regulationHtml = '';
    this.regulationError = '';
    this.regulationLoading = false;
    if (this.activeView === 'regulation') this.showRegulation();
  }
  showRegulation() {
    this.activeView = 'regulation';
    this.selectedRace = undefined;
    this.error = '';
    if (this.regulationHtml || this.regulationLoading) return;
    this.regulationLoading = true;
    this.regulationError = '';
    const language = this.i18n.language();
    this.api.regulation(language).subscribe({
      next: markdown => { if (this.i18n.language() !== language) return; this.regulationHtml = this.renderRegulationMarkdown(markdown); this.regulationLoading = false; this.cdr.markForCheck(); },
      error: () => { if (this.i18n.language() !== language) return; this.regulationError = 'Impossible de charger le règlement.'; this.regulationLoading = false; this.cdr.markForCheck(); }
    });
  }
  private renderRegulationMarkdown(markdown: string): string {
    const categoryLine = /^(ED|DA|A[1-4]|EH|SE|V[1-5])\s/;
    return markdown.replace(/\r/g, '').trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      const heading = lines.length === 1 ? /^(#{1,3})\s+(.+)$/.exec(lines[0]) : null;
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${this.regulationInline(heading[2])}</h${level}>`;
      }
      if (lines.every(line => categoryLine.test(line))) {
        return `<ul class="regulation-categories">${lines.map(line => `<li>${this.regulationInline(line.replace(/^[A-Z][A-Z0-9]*\s+\(([^)]+)\)/, '$1'))}</li>`).join('')}</ul>`;
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
  private loadMe() {
    this.api.me().subscribe({
      next: me => {
        this.me = me;
        this.authChecked = true;
        if (me.runnerId == null) this.showSettings();
        this.loadFavorites();
        this.cdr.markForCheck();
      },
      error: () => { this.me = undefined; this.favorites = []; this.favoritesRequestId++; this.authChecked = true; this.cdr.markForCheck(); }
    });
  }
  showFavorites() {
    this.closeRunner();
    this.selectedRace = undefined;
    this.activeView = 'favorites';
    this.error = '';
    if (this.me) this.loadFavorites();
  }
  isFavorite(id: number) { return this.favorites.some(runner => runner.id === id); }
  loadFavorites() {
    if (!this.me) return;
    const userId = this.me.id;
    const requestId = ++this.favoritesRequestId;
    this.favoritesLoading = true;
    this.favoritesError = '';
    if (this.activeView === 'favorites') {
      this.favoriteSuggestions = undefined;
      this.loadFavoriteSuggestions(0);
    }
    this.api.favorites().subscribe({
      next: runners => {
        if (this.me?.id !== userId || requestId !== this.favoritesRequestId) return;
        this.favorites = runners;
        this.favoritesLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        if (this.me?.id !== userId || requestId !== this.favoritesRequestId) return;
        this.favoritesLoading = false;
        this.favoritesError = 'Impossible de charger les favoris.';
        if (error.status === 401) this.fail(error);
        this.cdr.markForCheck();
      },
    });
  }
  loadFavoriteSuggestions(page: number) {
    const userId = this.me?.id;
    const runnerId = this.me?.runnerId;
    const requestId = ++this.favoriteSuggestionsRequestId;
    this.favoriteSuggestionsError = false;
    if (!runnerId) return;

    const isCurrent = () => this.me?.id === userId && this.me?.runnerId === runnerId
      && requestId === this.favoriteSuggestionsRequestId;
    this.api.favoriteSuggestions(page).subscribe({
      next: suggestions => {
        if (!isCurrent()) return;
        const lastPage = Math.max(0, Math.ceil(suggestions.total / suggestions.size) - 1);
        if (suggestions.page > lastPage) {
          this.loadFavoriteSuggestions(lastPage);
          return;
        }
        this.favoriteSuggestions = suggestions;
        this.cdr.markForCheck();
      },
      error: () => {
        if (!isCurrent()) return;
        this.favoriteSuggestionsError = true;
        this.cdr.markForCheck();
      },
    });
  }
  toggleFavorite(runner: Runner) {
    if (!this.me || this.savingFavorites.has(runner.id) || this.favoritesLoading || this.favoritesError) return;
    const userId = this.me.id;
    const remove = this.isFavorite(runner.id);
    this.savingFavorites.add(runner.id);
    this.favoritesError = '';
    const request = remove ? this.api.removeFavorite(runner.id) : this.api.addFavorite(runner.id);
    request.subscribe({
      next: () => {
        this.savingFavorites.delete(runner.id);
        if (this.me?.id !== userId) return;
        this.favoritesRequestId++;
        this.favoritesLoading = false;
        this.favorites = this.favorites.filter(favorite => favorite.id !== runner.id);
        if (!remove) this.favorites.push(runner);
        this.favorites.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
        if (this.activeView === 'favorites') this.loadFavoriteSuggestions(this.favoriteSuggestions?.page ?? 0);
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.savingFavorites.delete(runner.id);
        if (this.me?.id !== userId) return;
        this.favoritesError = 'Impossible de modifier les favoris.';
        if (error.status === 401) this.fail(error);
        this.cdr.markForCheck();
      },
    });
  }
  openLinkedRunner() {
    if (!this.me || this.openingLinkedRunner) return;
    if (!this.me.runnerId) { this.showSettings(); return; }
    const userId = this.me.id;
    const runnerId = this.me.runnerId;
    this.openingLinkedRunner = true;
    this.api.runner(runnerId).subscribe({
      next: runner => {
        this.openingLinkedRunner = false;
        if (this.me?.id === userId && this.me.runnerId === runnerId) this.openRunner(runner);
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.openingLinkedRunner = false;
        if (this.me?.id !== userId || this.me.runnerId !== runnerId) return;
        if (error.status === 401) this.fail(error);
        else { this.showSettings(); this.runnerLinkError = 'Impossible d’ouvrir la fiche du coureur lié.'; }
        this.cdr.markForCheck();
      },
    });
  }
  showSettings() {
    this.closeRunner();
    this.selectedRace = undefined;
    this.activeView = 'settings';
    this.accountRunnerQuery = '';
    this.bannerError = '';
    this.runnerLinkMessage = '';
    this.loadAccountRunners();
    this.confirmAccountDeletion = false;
    this.accountError = '';
    this.error = '';
  }
  loadAccountRunners() {
    if (!this.me) return;
    const userId = this.me.id;
    const requestId = ++this.runnerLinkRequestId;
    this.runnerLinkLoading = true;
    this.runnerLinkError = '';
    this.suggestedRunners = [];
    this.linkedRunner = undefined;
    const query = this.accountRunnerQuery.trim();
    const candidates = query.length >= 2
      ? this.api.runners(query, 0, 5).pipe(switchMap(page => of(page.content)))
      : this.api.runnerSuggestions();
    forkJoin({
      candidates,
      linked: this.me.runnerId ? this.api.runner(this.me.runnerId).pipe(catchError(() => of(null))) : of(null),
    }).subscribe({
      next: ({ candidates, linked }) => {
        if (this.me?.id !== userId || requestId !== this.runnerLinkRequestId) return;
        this.suggestedRunners = candidates;
        this.linkedRunner = linked ?? undefined;
        this.runnerLinkLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        if (this.me?.id !== userId || requestId !== this.runnerLinkRequestId) return;
        this.runnerLinkLoading = false;
        this.runnerLinkError = 'Impossible de charger les coureurs.';
        if (error.status === 401) this.fail(error);
        this.cdr.markForCheck();
      },
    });
  }
  saveRunnerLink(runner?: Runner) {
    if (!this.me || this.runnerLinkSaving || this.deletingAccount) return;
    const userId = this.me.id;
    this.runnerLinkSaving = true;
    this.runnerLinkError = '';
    this.runnerLinkMessage = '';
    const request = runner ? this.api.linkRunner(runner.id) : this.api.unlinkRunner();
    request.subscribe({
      next: () => {
        this.runnerLinkSaving = false;
        if (this.me?.id !== userId) return;
        this.runnerLinkRequestId++;
        this.runnerLinkLoading = false;
        this.me = { ...this.me, runnerId: runner?.id ?? null };
        this.linkedRunner = runner;
        this.runnerLinkMessage = runner ? 'Ton compte est lié à ce coureur.' : 'La liaison a été retirée.';
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.runnerLinkSaving = false;
        if (this.me?.id !== userId) return;
        this.runnerLinkError = error.status === 409 ? 'Ce coureur est déjà lié à un autre compte Google.' : 'Impossible de modifier la liaison. Réessaie dans un instant.';
        if (error.status === 401) this.fail(error);
        this.cdr.markForCheck();
      },
    });
  }
  deleteAccount() {
    if (!this.me || !this.confirmAccountDeletion || this.deletingAccount || this.runnerLinkSaving) return;
    this.deletingAccount = true;
    this.accountError = '';
    this.api.deleteAccount().subscribe({
      next: () => {
        this.deletingAccount = false;
        this.confirmAccountDeletion = false;
        this.closeRunner();
        this.me = undefined; this.favorites = []; this.favoritesRequestId++;
        this.runners = [];
        this.runnerTotal = 0;
        this.runnerQuery = '';
        this.backToCalendar();
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingAccount = false;
        this.accountError = 'Impossible de supprimer le compte. Réessaie dans un instant.';
        if (error.status === 401) this.fail(error);
        this.cdr.markForCheck();
      },
    });
  }
  login() { window.location.href = this.api.loginUrl(); }
  logout() {
    this.api.logout().subscribe({
      next: () => { this.closeRunner(); this.me = undefined; this.favorites = []; this.favoritesRequestId++; this.runners = []; this.runnerTotal = 0; this.runnerQuery = ''; this.error = ''; if (this.activeView === 'settings' || this.activeView === 'favorites') this.backToCalendar(); this.cdr.markForCheck(); },
      error: e => { this.fail(e); this.cdr.markForCheck(); }
    });
  }
  get initials() {
    const name = (this.me?.displayName || this.me?.email || '?').trim();
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
  }
  private fail(e: HttpErrorResponse) { if (e.status === 401) { this.me = undefined; this.favorites = []; this.favoritesRequestId++; this.error = 'Connecte-toi avec Google pour accéder à cette fonction.'; return; } if (e.status === 403) { this.error = 'Accès refusé.'; return; } this.error = e.status === 0 ? 'Impossible de joindre l’API ACRHO. Vérifie que le serveur est démarré et accessible sur le réseau.' : `Erreur API (${e.status}) : ${e.error?.message ?? e.message}`; }
}



























