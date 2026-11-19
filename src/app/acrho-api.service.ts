import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Season { id: number; year: number; }
export interface Race { id: number; seasonId: number; name: string; raceDate: string; city?: string; coefficient?: number; status?: string; }
export interface RouteInfo { id: number; label: string; distanceM?: number; startTime?: string | null; type?: string; challenge?: boolean; }
export interface RacePracticalInfo { details?: Record<string, unknown>; sourceUrl?: string | null; }
export interface RacePhoto {
  url: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
}
export interface RaceDetail extends Race { organizer?: string; routes: RouteInfo[]; practicalInfo?: RacePracticalInfo | null; }
export interface Runner { id: number; firstName: string; lastName: string; gender?: string; club?: string; category?: string | null; categoryYear?: number | null; pictureUrl?: string | null; bannerColor?: string; }
export interface Me { id: number; email: string; displayName?: string; role: 'USER' | 'ADMIN'; pictureUrl?: string | null; createdAt?: string | null; runnerId?: number | null; }
export interface Category { id: number; code: string; label: string; }
export interface Result { overallRank?: number; categoryRank?: number; bibNumber?: number; runner: Runner; category?: string | null; timeMs?: number | null; time?: string; status?: string; points?: number | null; }
export interface RunnerResult { raceId: number; raceName: string; raceDate: string; city?: string; routeId: number; routeLabel: string; distanceM?: number; result: Result; }
export interface VdotPerformance {
  raceId: number;
  raceName: string;
  date: string;
  distanceMeters: number;
  durationSeconds: number | null;
  vdot: number | null;
  reliability: 'STANDARD' | 'ESTIMATED';
  warnings: string[];
}

export interface RunnerVdot {
  runnerId: number;
  seasonId: number;
  statistics: {
    bestVdot: number | null;
    averageVdot: number | null;
    firstVdot: number | null;
    lastVdot: number | null;
    evolution: number | null;
    raceCount: number;
    validRaceCount: number;
  };
  performances: VdotPerformance[];
}

export interface Page<T> { content: T[]; page: number; size: number; total: number; }

export interface StandingEntry {
  runnerId: number;
  pictureUrl?: string | null;
  firstName: string;
  lastName: string;
  category: string | null;
  score: { participations: number; resultPoints: number; bonusPoints: number };
}

export interface SeasonStandings {
  year: number;
  minimumParticipations: number;
  categories: Category[];
  entries: StandingEntry[];
}

export interface RunnerStanding {
  year: number;
  placement: {
    category: string | null;
    overallRank: number | null;
    categoryRank: number | null;
    points: number;
    participations?: number;
    provisional: boolean;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class AcrhoApi {
  private http = inject(HttpClient);
  private apiUrl(path: string) { return `${environment.apiBaseUrl}${path}`; }
  health() { return this.http.get<{ status: string }>('https://acrho-challenge.ddns.net/actuator/health'); }
  seasons() { return this.http.get<Season[]>(this.apiUrl('/api/v1/seasons')); }
  currentStandings() {
    return this.http.get<SeasonStandings>(this.apiUrl('/api/v1/standings/current'));
  }
  /** The signed-in person; answers 401 when nobody is signed in. */
  me() { return this.http.get<Me>(this.apiUrl('/api/v1/me')); }
  /** Sign-in is a full-page navigation to the API, which sends the browser to Google and back to the site. */
  loginUrl() { return this.apiUrl('/oauth2/authorization/google'); }
  /** The X-XSRF-TOKEN header is added by Angular from the XSRF-TOKEN cookie (same origin). */
  favorites() { return this.http.get<Runner[]>(this.apiUrl('/api/v1/me/favorites')); }
  addFavorite(id: number) { return this.http.put<void>(this.apiUrl(`/api/v1/me/favorites/${id}`), null); }
  removeFavorite(id: number) { return this.http.delete<void>(this.apiUrl(`/api/v1/me/favorites/${id}`)); }
  changeBanner(color: string) { return this.http.put<void>(this.apiUrl('/api/v1/me/runner/banner'), { color }); }
  runnerSuggestions() { return this.http.get<Runner[]>(this.apiUrl('/api/v1/me/runner-suggestions')); }
  linkRunner(runnerId: number) { return this.http.put<void>(this.apiUrl('/api/v1/me/runner'), { runnerId }); }
  unlinkRunner() { return this.http.delete<void>(this.apiUrl('/api/v1/me/runner')); }
  deleteAccount() { return this.http.delete<void>(this.apiUrl('/api/v1/me')); }
  logout() { return this.http.post(this.apiUrl('/logout'), null); }
  regulation(language = 'fr') { return this.http.get(`assets/reglement${language === 'fr' ? '' : '.' + language}.md`, { responseType: 'text' }); }
  races(year: number) { return this.http.get<Race[]>(this.apiUrl(`/api/v1/seasons/year/${year}/races`)); }
  racePhoto(id: number) { return this.http.get<RacePhoto | null>(this.apiUrl(`/api/v1/races/${id}/photo`)); }
  race(id: number) { return this.http.get<RaceDetail>(this.apiUrl(`/api/v1/races/${id}`)); }
  categories() { return this.http.get<Category[]>(this.apiUrl('/api/v1/categories')); }
  results(routeId: number, page = 0, size = 20, q = '', category = '', gender = ''): Observable<Page<Result>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'overallRank,asc');
    if (q) params = params.set('q', q);
    if (category) params = params.set('category', category);
    if (gender) params = params.set('gender', gender);
    return this.http.get<Page<Result>>(this.apiUrl(`/api/v1/routes/${routeId}/results`), { params });
  }
  runner(id: number) { return this.http.get<Runner>(this.apiUrl(`/api/v1/runners/${id}`)); }
  runnerStanding(id: number) {
    return this.http.get<RunnerStanding>(this.apiUrl(`/api/v1/runners/${id}/standing`));
  }
  runnerSeasons(id: number) { return this.http.get<number[]>(this.apiUrl(`/api/v1/runners/${id}/seasons`)); }
  runnerVdot(id: number, seasonId: number) {
    return this.http.get<RunnerVdot>(this.apiUrl(`/api/v1/runners/${id}/seasons/${seasonId}/vdot`));
  }
  runnerResults(id: number, year: number) {
    return this.http.get<RunnerResult[]>(this.apiUrl(`/api/v1/runners/${id}/results`), { params: { year } });
  }
  runners(q: string, page = 0, size = 20) {
    return this.http.get<Page<Runner>>(this.apiUrl('/api/v1/runners'), { params: { q, page, size } });
  }
}



