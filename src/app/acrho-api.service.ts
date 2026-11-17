import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Season { id: number; year: number; }
export interface Race { id: number; seasonId: number; name: string; raceDate: string; city?: string; coefficient?: number; status?: string; }
export interface RouteInfo { id: number; label: string; distanceM?: number; startTime?: string | null; type?: string; challenge?: boolean; }
export interface RacePracticalInfo { details?: Record<string, unknown>; sourceUrl?: string | null; }
export interface RaceDetail extends Race { organizer?: string; routes: RouteInfo[]; practicalInfo?: RacePracticalInfo | null; }
export interface Runner { id: number; firstName: string; lastName: string; gender?: string; birthYear?: number; club?: string; }
export interface Category { id: number; code: string; label: string; }
export interface Result { overallRank?: number; categoryRank?: number; bibNumber?: number; runner: Runner; category?: string | null; timeMs?: number | null; time?: string; status?: string; }
export interface Page<T> { content: T[]; page: number; size: number; total: number; }

@Injectable({ providedIn: 'root' })
export class AcrhoApi {
  private http = inject(HttpClient);
  seasons() { return this.http.get<Season[]>('/api/v1/seasons'); }
  regulation() { return this.http.get('assets/reglement.md', { responseType: 'text' }); }
  races(year: number) { return this.http.get<Race[]>(`/api/v1/seasons/year/${year}/races`); }
  race(id: number) { return this.http.get<RaceDetail>(`/api/v1/races/${id}`); }
  categories() { return this.http.get<Category[]>('/api/v1/categories'); }
  results(routeId: number, page = 0, size = 20, q = '', category = '', gender = ''): Observable<Page<Result>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'overallRank,asc');
    if (q) params = params.set('q', q);
    if (category) params = params.set('category', category);
    if (gender) params = params.set('gender', gender);
    return this.http.get<Page<Result>>(`/api/v1/routes/${routeId}/results`, { params });
  }
  runners(q: string, page = 0, size = 20) {
    return this.http.get<Page<Runner>>('/api/v1/runners', { params: { q, page, size } });
  }
}



