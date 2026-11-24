import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, finalize, map, of, startWith, switchMap } from 'rxjs';
import { AcrhoApi, AdminRace } from './acrho-api.service';

@Component({
  selector: 'app-admin-race-mail',
  templateUrl: './admin-race-mail.html',
  styles: [`
    :host { display: block; padding-top: 20px; }
    label { display: grid; gap: 6px; margin-bottom: 14px; max-width: 600px; }
    input, select, textarea, button { font: inherit; padding: 8px; }
    iframe { display: block; width: 100%; height: 680px; margin-top: 16px; border: 1px solid var(--acrho-border); }
  `],
})
export class AdminRaceMail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(AcrhoApi);
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly template = toSignal(inject(HttpClient).get('assets/race-results-mail.html', { responseType: 'text' }).pipe(
    catchError(() => of(null)),
  ));

  readonly statusLabels: Record<AdminRace['status'], string> = {
    PLANNED: 'À venir',
    RESULTS_RECEIVED: 'Résultats reçus',
    PUBLISHED: 'Publiée',
    CANCELLED: 'Annulée',
  };

  readonly year = signal<number | null>(null);
  readonly race = signal<AdminRace | null>(null);
  readonly message = signal('');
  readonly resultsUrl = signal('');
  readonly unsubscribeUrl = signal('');
  readonly seasons = toSignal(this.api.seasons().pipe(
    map(seasons => [...seasons].sort((a, b) => b.year - a.year)),
    catchError(() => of(null)),
  ));
  readonly selectedYear = computed(() => this.year() ?? this.seasons()?.[0]?.year ?? null);
  readonly races = toSignal(toObservable(this.selectedYear).pipe(
    switchMap(year => year === null ? of([]) : this.api.adminRaces(year).pipe(
      map(races => races.filter(race => race.status !== 'CANCELLED')),
      catchError(() => of(null)),
      startWith(undefined),
    )),
  ));
  private readonly racePhoto = toSignal(toObservable(this.race).pipe(
    switchMap(race => race ? this.api.findOrDiscoverAdminRacePhoto(race.id).pipe(
      map(photo => ({ raceId: race.id, photo, failed: false })),
      catchError(() => of({ raceId: race.id, photo: null, failed: true })),
    ) : of(null)),
  ));
  readonly photoResult = computed(() => {
    const result = this.racePhoto();
    return result?.raceId === this.race()?.id ? result : null;
  });
  readonly sending = signal(false);
  readonly sendNotice = signal<{ success: boolean; text: string } | null>(null);
  readonly canSend = computed(() => !!this.html() && !!this.photoResult() && !this.sending());
  readonly templateFailed = computed(() => this.template() === null);
  readonly canExport = computed(() => !!this.html() && !!httpsUrl(this.resultsUrl()) && !!httpsUrl(this.unsubscribeUrl()));

  private renderHtml(logoUrl: string) {
    const template = this.template();
    const race = this.race();
    if (!template || !race) return '';
    const photo = this.photoResult()?.photo;
    const photoUrl = httpsUrl(photo?.url ?? '');
    const sourceUrl = httpsUrl(photo?.sourceUrl ?? '');
    const licenseUrl = httpsUrl(photo?.licenseUrl ?? '');
    const photoHtml = photo && photoUrl && sourceUrl ? `
      <tr><td><img src="${escapeHtml(photoUrl)}" alt="Photo d’illustration de ${escapeHtml(race.city || race.name)}" width="600" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>
      <tr><td style="padding:8px 20px;text-align:center;font-size:12px;color:#304B68">
        Photo d’illustration · ${escapeHtml(photo.author)} · <a href="${escapeHtml(sourceUrl)}">Wikimedia Commons</a> ·
        ${licenseUrl ? `<a href="${escapeHtml(licenseUrl)}">${escapeHtml(photo.license)}</a>` : escapeHtml(photo.license)}
      </td></tr>` : '';
    const values: Record<string, string> = {
      raceName: escapeHtml(race.name),
      message: formatAnnouncement(this.message(), race.name, formatRaceDate(race.raceDate)),
      logoUrl: escapeHtml(logoUrl),
      resultsUrl: escapeHtml(httpsUrl(this.resultsUrl()) ?? 'https://acrho.run/'),
      unsubscribeUrl: escapeHtml(httpsUrl(this.unsubscribeUrl()) ?? '#'),
      photo: photoHtml,
    };
    return template.replace(/\{\{(\w+)\}\}/g, (token, key: string) => values[key] ?? token);
  }

  private readonly html = computed(() => this.renderHtml('https://acrho-challenge.ddns.net/assets/acrho-logo.png'));

  readonly preview = computed(() => {
    const logoUrl = new URL('assets/acrho-logo.png', this.document.baseURI).href;
    return this.sanitizer.bypassSecurityTrustHtml(this.renderHtml(logoUrl));
  });

  selectYear(year: string) {
    this.selectRace('');
    this.year.set(Number(year));
  }

  selectRace(id: string) {
    const race = this.races()?.find(race => race.id === Number(id)) ?? null;
    this.race.set(race);
    this.sendNotice.set(null);
    this.resultsUrl.set('');
    this.message.set(race ? `Les résultats de la course ${race.name} du ${formatRaceDate(race.raceDate)} sont disponibles sur acrho.run.` : '');
  }

  sendTest() {
    const race = this.race();
    if (!race || !this.canSend()) return;
    this.sending.set(true);
    this.sendNotice.set(null);
    this.api.sendRaceResultsTest(`Résultats · ${race.name}`, this.html()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.sending.set(false)),
    ).subscribe({
      next: () => this.sendNotice.set({ success: true, text: 'Mail de test accepté par le serveur SMTP.' }),
      error: error => this.sendNotice.set({
        success: false,
        text: error?.error?.detail || 'Impossible d’envoyer le mail de test.',
      }),
    });
  }

  download() {
    if (!this.canExport()) return;
    const url = URL.createObjectURL(new Blob([this.html()], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultats-course-${this.race()?.id}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function httpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function formatRaceDate(date: string): string {
  return new Intl.DateTimeFormat('fr-BE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date));
}

function formatAnnouncement(message: string, raceName: string, raceDate: string): string {
  const emphasized = [raceName, raceDate].sort((a, b) => b.length - a.length);
  const pattern = emphasized.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return message.split(new RegExp(`(${pattern})`, 'g')).map((part, index) =>
    index % 2 === 1 ? `<strong>${escapeHtml(part)}</strong>` : escapeHtml(part).replace(/\r?\n/g, '<br>'),
  ).join('');
}
