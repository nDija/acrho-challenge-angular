import { AsyncPipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Injectable, Input, OnChanges, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, switchMap, timeout } from 'rxjs';
import { AcrhoApi, Race } from './acrho-api.service';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface HourlyForecast {
  time: string[];
  temperature_2m: (number | null)[];
  precipitation_probability: (number | null)[];
}

interface RaceForecast {
  departure: string;
  temperature: number;
  rain: number | null | undefined;
}

const raceTimezone = 'Europe/Brussels';
const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: raceTimezone, dateStyle: 'short' });

@Injectable({ providedIn: 'root' })
export class RaceWeatherService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(AcrhoApi);
  private readonly cache = new Map<string, { expires: number; forecast: Observable<RaceForecast[]> }>();

  forecast(race: Race): Observable<RaceForecast[]> {
    const city = race.city?.trim();
    const now = Date.now();
    const today = Date.parse(dateFormat.format(now));
    const raceDay = Date.parse(race.raceDate);
    if (!city || !Number.isFinite(raceDay) || raceDay < today || raceDay >= today + 16 * 86_400_000) {
      return of([]);
    }

    const key = JSON.stringify([race.id, city.toLowerCase(), race.raceDate]);
    for (const [cachedKey, entry] of this.cache) {
      if (entry.expires <= now) this.cache.delete(cachedKey);
    }
    const cached = this.cache.get(key);
    if (cached) return cached.forecast;

    const forecast = this.api.race(race.id).pipe(
      switchMap(({ routes }) => {
        const departures = [...new Set(routes.flatMap(({ startTime }) =>
          startTime ? [startTime.slice(0, 5)] : [],
        ))].sort();
        if (!departures.length) return of([]);

        return this.http.get<{ results?: Coordinates[] }>('https://geocoding-api.open-meteo.com/v1/search', {
          params: { name: city, count: 1, countryCode: 'BE' },
        }).pipe(
          switchMap(({ results }) => {
            const location = results?.[0];
            return location ? this.hourlyForecast(location, race.raceDate, departures) : of([]);
          }),
        );
      }),
      timeout(8000),
      catchError(() => {
        this.cache.delete(key);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.cache.set(key, { expires: now + 30 * 60_000, forecast });
    return forecast;
  }

  private hourlyForecast(location: Coordinates, date: string, departures: string[]): Observable<RaceForecast[]> {
    return this.http.get<{ hourly: HourlyForecast }>('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: raceTimezone,
        start_date: date,
        end_date: date,
        hourly: 'temperature_2m,precipitation_probability',
      },
    }).pipe(map(({ hourly }) => departures.flatMap(departure => {
      const hour = departure.slice(0, 2);
      const index = hourly.time.indexOf(date + 'T' + hour + ':00');
      const temperature = hourly.temperature_2m[index];
      return temperature == null ? [] : [{ departure, temperature, rain: hourly.precipitation_probability[index] }];
    })));
  }
}

@Component({
  selector: 'app-race-weather',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, TranslatePipe],
  template: `
    @if (forecast | async; as departures) {
      @for (weather of departures; track weather.departure) {
        <small>
          {{ 'Météo au départ' | t }} {{ weather.departure }} ·
          {{ weather.temperature | number:'1.0-0':i18n.locale() }} °C
          @if (weather.rain != null) {
            · {{ 'Risque de précipitations' | t }} {{ weather.rain }} %
          }
          · Open-Meteo
        </small>
      }
    }
  `,
  styles: [`:host { display: contents; } small { display: block; margin-top: .25rem; font-size: .8em; }`],
})
export class RaceWeather implements OnChanges {
  @Input({ required: true }) race!: Race;
  readonly i18n = inject(LanguageService);
  private readonly weather = inject(RaceWeatherService);
  forecast?: Observable<RaceForecast[]>;

  ngOnChanges(): void {
    this.forecast = this.weather.forecast(this.race);
  }
}
