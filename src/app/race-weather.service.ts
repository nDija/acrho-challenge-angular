import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface ArchiveResponse {
  daily?: {
    temperature_2m_mean?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
}

export interface RaceWeather {
  temperature: number;
  precipitation: number;
  wind: number;
}

function normalizeCity(city: string): string {
  return city.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

@Injectable({ providedIn: 'root' })
export class RaceWeatherService {
  private readonly http = inject(HttpClient);
  private readonly locations = new Map<string, Location>();
  private readonly weather = new Map<string, RaceWeather>();

  forRace(city: string, date: string): Observable<RaceWeather | null> {
    const cityKey = normalizeCity(city);
    const key = `${cityKey}:${date}`;
    const cachedWeather = this.weather.get(key);
    if (cachedWeather) return of(cachedWeather);

    const cachedLocation = this.locations.get(cityKey);
    const location = cachedLocation ? of(cachedLocation) : this.http.get<{ results?: Location[] }>(
      'https://geocoding-api.open-meteo.com/v1/search',
      { params: { name: city.trim(), countryCode: 'BE', language: 'fr', count: 10 }, timeout: 5_000 },
    ).pipe(
      map(response => {
        const matches = response.results?.filter(result => normalizeCity(result.name) === cityKey);
        return matches?.length === 1 ? matches[0] : null;
      }),
      tap(result => { if (result) this.locations.set(cityKey, result); }),
    );

    return location.pipe(
      switchMap(result => result ? this.archive(result, date) : of(null)),
      tap(result => { if (result) this.weather.set(key, result); }),
      catchError(() => of(null)),
    );
  }

  private archive(location: Location, date: string): Observable<RaceWeather | null> {
    return this.http.get<ArchiveResponse>('https://archive-api.open-meteo.com/v1/archive', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        start_date: date,
        end_date: date,
        daily: 'temperature_2m_mean,precipitation_sum,wind_speed_10m_max',
        timezone: 'Europe/Brussels',
      },
      timeout: 5_000,
    }).pipe(map(({ daily }) => {
      const temperature = daily?.temperature_2m_mean?.[0];
      const precipitation = daily?.precipitation_sum?.[0];
      const wind = daily?.wind_speed_10m_max?.[0];
      return temperature != null && precipitation != null && wind != null
        ? { temperature, precipitation, wind } : null;
    }));
  }
}
