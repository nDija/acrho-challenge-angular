import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import type { RacePhoto } from './acrho-api.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-race-photo-credit',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, MatIconModule, MatMenuModule],
  templateUrl: './race-photo-credit.html',
  styleUrl: './race-photo-credit.scss',
})
export class RacePhotoCredit {
  readonly photo = input.required<RacePhoto>();
}
