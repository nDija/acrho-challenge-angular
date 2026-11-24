import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, finalize, map, of, startWith, switchMap, throwError } from 'rxjs';
import { AcrhoApi, AdminRace, GooglePlacesPhotoPreview, RacePhoto, RacePhotoCandidate, UnsplashPhotoCandidate } from './acrho-api.service';

@Component({
  selector: 'app-admin-race-mail',
  imports: [MatButtonModule, NgTemplateOutlet],
  templateUrl: './admin-race-mail.html',
  styleUrl: './admin-race-mail.scss',
})
export class AdminRaceMail {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(AcrhoApi);
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly template = toSignal(this.http.get('assets/race-results-mail.html', { responseType: 'text' }).pipe(
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
  private readonly savedPhoto = signal<{ raceId: number; photo: RacePhoto; failed: false } | null>(null);
  readonly upload = signal<{ file: File; preview: string } | null>(null);
  readonly uploadAuthor = signal('');
  readonly uploadError = signal<string | null>(null);
  readonly photoPickerOpen = signal(false);
  readonly photoCandidates = signal<RacePhotoCandidate[] | null>(null);
  readonly googlePlacesPreviews = signal<GooglePlacesPhotoPreview[] | null>(null);
  readonly googlePlacesLoading = signal(false);
  readonly googlePlacesError = signal(false);
  readonly unsplashCandidates = signal<UnsplashPhotoCandidate[] | null>(null);
  readonly unsplashLoading = signal(false);
  readonly unsplashError = signal<string | null>(null);
  readonly photoLoading = signal(false);
  readonly photoSaving = signal(false);
  readonly photoNotice = signal<{ success: boolean; text: string } | null>(null);

  readonly photoResult = computed(() => {
    const saved = this.savedPhoto();
    if (saved && saved.raceId === this.race()?.id) return saved;
    const result = this.racePhoto();
    return result?.raceId === this.race()?.id ? result : null;
  });
  private readonly uploadedPhotoUrl = computed(() => {
    const photo = this.photoResult()?.photo;
    return photo?.uploaded ? photo.url : null;
  });
  readonly uploadedPreview = toSignal(toObservable(this.uploadedPhotoUrl).pipe(
    switchMap(url => url ? this.http.get(url, { responseType: 'blob' }).pipe(
      switchMap(image => readPreviewImage(image)),
      map(dataUrl => ({ url, dataUrl, failed: false })),
      catchError(() => of({ url, dataUrl: null, failed: true })),
      startWith(null),
    ) : of(null)),
  ));

  readonly sending = signal(false);
  readonly sendNotice = signal<{ success: boolean; text: string } | null>(null);
  readonly canSend = computed(() => !!this.html() && !!this.photoResult() && !this.photoSaving() && !this.sending());
  readonly templateFailed = computed(() => this.template() === null);
  readonly canExport = computed(() => !!this.html() && !!httpsUrl(this.resultsUrl()) && !!httpsUrl(this.unsubscribeUrl()));

  constructor() {
    this.destroyRef.onDestroy(() => this.clearUpload());
  }

  private renderHtml(logoUrl: string, previewImage?: string | null) {
    const template = this.template();
    const race = this.race();
    if (!template || !race) return '';
    const photo = this.photoResult()?.photo;
    const photoUrl = photo?.uploaded
      ? (previewImage === undefined ? httpsUrl(photo.url + '&mail=1') : previewImage)
      : httpsUrl(photo?.url ?? '');
    const sourceUrl = httpsUrl(photo?.sourceUrl ?? '');
    const authorUrl = httpsUrl(photo?.authorUrl ?? '');
    const licenseUrl = httpsUrl(photo?.licenseUrl ?? '');
    const photoHtml = photo && photoUrl && (sourceUrl || photo.uploaded) ? `
      <tr><td><img src="${escapeHtml(photoUrl)}" alt="Photo d’illustration de ${escapeHtml(race.city || race.name)}" width="600" height="300" style="display:block;width:100%;max-width:600px;height:auto;aspect-ratio:2 / 1;object-fit:cover;object-position:center"></td></tr>
      <tr><td style="padding:8px 20px;text-align:center;font-size:12px;color:#304B68">
        ${photo.uploaded ? `Photo importée · ${escapeHtml(photo.author)}${sourceUrl ? ` · <a href="${escapeHtml(sourceUrl)}">Source de l’image affichée</a>` : ''}` : `
        Photo d’illustration · ${authorUrl ? `<a href="${escapeHtml(authorUrl)}">${escapeHtml(photo.author)}</a>` : escapeHtml(photo.author)} · <a href="${escapeHtml(sourceUrl ?? '')}">${authorUrl ? 'Unsplash' : 'Wikimedia Commons'}</a> ·
        ${licenseUrl ? `<a href="${escapeHtml(licenseUrl)}">${escapeHtml(photo.license)}</a>` : escapeHtml(photo.license)}`}
      </td></tr>` : '';
    const values: Record<string, string> = {
      raceName: escapeHtml(race.name),
      message: formatAnnouncement(this.message(), race.name, formatRaceDate(race.raceDate)),
      logoUrl: escapeHtml(logoUrl),
      resultsUrl: escapeHtml(httpsUrl(this.resultsUrl()) ?? raceResultsUrl(race.id)),
      unsubscribeUrl: escapeHtml(httpsUrl(this.unsubscribeUrl()) ?? '#'),
      photo: photoHtml,
    };
    return template.replace(/\{\{(\w+)\}\}/g, (token, key: string) => values[key] ?? token);
  }

  private readonly html = computed(() => this.renderHtml('https://acrho-challenge.ddns.net/assets/acrho-logo-mail.png'));

  readonly preview = computed(() => {
    const logoUrl = new URL('assets/acrho-logo-mail.png', this.document.baseURI).href;
    const uploaded = this.uploadedPreview();
    const photo = this.uploadedPhotoUrl();
    const previewImage = photo && uploaded?.url === photo ? uploaded.dataUrl : null;
    return this.sanitizer.bypassSecurityTrustHtml(this.renderHtml(logoUrl, previewImage));
  });

  selectYear(year: string) {
    this.selectRace('');
    this.year.set(Number(year));
  }

  selectRace(id: string) {
    const race = this.races()?.find(race => race.id === Number(id)) ?? null;
    this.race.set(race);
    this.savedPhoto.set(null);
    this.clearUpload();
    this.uploadAuthor.set('');
    this.uploadError.set(null);
    this.photoPickerOpen.set(false);
    this.googlePlacesPreviews.set(null);
    this.googlePlacesLoading.set(false);
    this.googlePlacesError.set(false);
    this.photoCandidates.set(null);
    this.unsplashCandidates.set(null);
    this.unsplashLoading.set(false);
    this.unsplashError.set(null);
    this.photoLoading.set(false);
    this.photoNotice.set(null);
    this.sendNotice.set(null);
    this.resultsUrl.set(race ? raceResultsUrl(race.id) : '');
    this.message.set(race ? `Les résultats de la course ${race.name} du ${formatRaceDate(race.raceDate)} sont disponibles sur acrho.run.` : '');
  }

  loadPhotoCandidates() {
    const race = this.race();
    if (!race || this.photoLoading() || this.photoSaving()) return;
    this.photoLoading.set(true);
    this.photoNotice.set(null);
    this.api.adminRacePhotoCandidates(race.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: candidates => {
        if (this.race() !== race) return;
        this.photoCandidates.set(candidates);
        this.photoLoading.set(false);
      },
      error: () => {
        if (this.race() !== race) return;
        this.photoNotice.set({ success: false, text: 'Impossible de charger les autres photos.' });
        this.photoLoading.set(false);
      },
    });
  }

  loadUnsplashCandidates(query: string) {
    const race = this.race();
    if (!race || this.unsplashLoading() || this.photoSaving() || this.sending()) return;
    this.unsplashLoading.set(true);
    this.unsplashError.set(null);
    this.unsplashCandidates.set(null);
    this.api.adminUnsplashPhotoCandidates(race.id, query.trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: candidates => {
        if (this.race() !== race) return;
        this.unsplashCandidates.set(candidates);
        this.unsplashLoading.set(false);
      },
      error: error => {
        if (this.race() !== race) return;
        this.unsplashError.set(error?.error?.detail || 'Impossible de charger les photos Unsplash.');
        this.unsplashLoading.set(false);
      },
    });
  }

  loadGooglePlacesPreviews() {
    const race = this.race();
    if (!race?.city?.trim() || this.googlePlacesLoading() || this.photoSaving() || this.sending()) return;
    this.googlePlacesLoading.set(true);
    this.googlePlacesError.set(false);
    this.googlePlacesPreviews.set(null);
    this.api.adminGooglePlacesPhotoPreviews(race.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: previews => {
        if (this.race() !== race) return;
        this.googlePlacesPreviews.set(previews);
        this.googlePlacesLoading.set(false);
      },
      error: () => {
        if (this.race() !== race) return;
        this.googlePlacesError.set(true);
        this.googlePlacesLoading.set(false);
      },
    });
  }

  chooseUpload(input: HTMLInputElement) {
    this.clearUpload();
    this.uploadError.set(null);
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size === 0 || file.size > 8 * 1024 * 1024) {
      this.uploadError.set('Choisis une photo de 8 Mo maximum.');
      return;
    }
    this.upload.set({ file, preview: URL.createObjectURL(file) });
  }

  private clearUpload() {
    const upload = this.upload();
    if (upload) URL.revokeObjectURL(upload.preview);
    this.upload.set(null);
  }

  saveUpload() {
    const race = this.race();
    const upload = this.upload();
    const author = this.uploadAuthor().trim();
    if (!race || !upload || !author || this.photoSaving() || this.sending()) return;

    this.photoSaving.set(true);
    this.photoNotice.set(null);
    this.uploadError.set(null);
    this.api.uploadAdminRacePhoto(race.id, upload.file, author).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.photoSaving.set(false)),
    ).subscribe({
      next: photo => {
        this.savedPhoto.set({ raceId: race.id, photo, failed: false });
        this.photoNotice.set({ success: true, text: 'Photo enregistrée pour le mail et la fiche de course.' });
        this.clearUpload();
        this.uploadAuthor.set('');
      },
      error: error => this.uploadError.set(error?.error?.detail || 'Impossible d’importer la photo.'),
    });
  }

  choosePhoto(candidate: RacePhotoCandidate | UnsplashPhotoCandidate) {
    const race = this.race();
    if (!race || this.photoSaving() || this.sending()) return;
    this.photoSaving.set(true);
    this.photoNotice.set(null);
    const selection = 'id' in candidate
      ? this.api.selectAdminUnsplashPhoto(race.id, candidate.id)
      : this.api.selectAdminRacePhoto(race.id, candidate.filename);
    selection.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.photoSaving.set(false)),
    ).subscribe({
      next: photo => {
        this.savedPhoto.set({ raceId: race.id, photo, failed: false });
        this.photoNotice.set({ success: true, text: 'Photo enregistrée pour le mail et la fiche de course.' });
      },
      error: error => this.photoNotice.set({ success: false, text: error?.error?.detail || 'Impossible d’enregistrer la photo.' }),
    });
  }

  private prepareMailPhoto(raceId: number) {
    const photo = this.photoResult()?.photo;
    if (!photo?.uploaded) return of(undefined);
    const url = httpsUrl(photo.url);
    const version = url ? new URL(url).searchParams.get('v') : null;
    return version ? this.api.enableRacePhotoMailAccess(raceId, version) : throwError(() => ({
      error: { detail: 'La photo importée doit être accessible à une adresse HTTPS pour figurer dans le mail.' },
    }));
  }

  sendTest() {
    const race = this.race();
    if (!race || !this.canSend()) return;
    this.sending.set(true);
    this.sendNotice.set(null);
    const html = this.html();
    this.prepareMailPhoto(race.id).pipe(
      switchMap(() => this.api.sendRaceResultsTest(`Résultats · ${race.name}`, html)),
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
    const race = this.race();
    if (!race || !this.canExport() || !this.photoResult() || this.photoSaving() || this.sending()) return;
    this.sending.set(true);
    this.sendNotice.set(null);
    const html = this.html();
    this.prepareMailPhoto(race.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.sending.set(false)),
    ).subscribe({
      next: () => {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
        const link = this.document.createElement('a');
        link.href = url;
        link.download = `resultats-course-${race.id}.html`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: error => this.sendNotice.set({
        success: false,
        text: error?.error?.detail || 'Impossible de préparer la photo pour le téléchargement du mail.',
      }),
    });
  }
}

function readPreviewImage(image: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && /^data:image\/(?:jpeg|png);base64,/.test(reader.result)) {
        resolve(reader.result);
      } else {
        reject(new Error('Unexpected photo format'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(image);
  });
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

function raceResultsUrl(raceId: number): string {
  return `https://acrho-challenge.ddns.net/?course=${raceId}`;
}
