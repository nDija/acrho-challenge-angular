import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Observable } from 'rxjs';
import type { RaceDetail, RacePhoto } from './acrho-api.service';
import { LanguageService } from './language.service';
import { RacePhotoCredit } from './race-photo-credit';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-planned-race-details',
  imports: [AsyncPipe, DecimalPipe, MatProgressSpinnerModule, RacePhotoCredit, TranslatePipe],
  templateUrl: './planned-race-details.html',
  styleUrl: './planned-race-details.scss',
})
export class PlannedRaceDetails {
  readonly i18n = inject(LanguageService);
  readonly photoSource = input<Observable<RacePhoto | null>>();
  readonly loading = input.required<boolean>();
  readonly details = input<RaceDetail>();
  readonly sections = input.required<readonly { key: string; label: string; value: string }[]>();
  readonly routeDescription = input<string>();
  readonly openRunnerUrl = input<string>();
  readonly loadedPhoto = signal<string | undefined>(undefined);
}
