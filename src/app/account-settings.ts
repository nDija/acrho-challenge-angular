import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { App } from './app';
import { ClubNamePipe } from './club-name.pipe';
import { TranslatePipe } from './translate.pipe';

type AccountSettingsContext = Pick<App,
  'me' | 'linkedRunner' | 'openRunner' | 'saveRunnerLink' | 'deletingAccount' | 'runnerLinkSaving'
  | 'bannerColors' | 'bannerSaving' | 'runnerLinkLoading' | 'changeBanner' | 'bannerError'
  | 'loadAccountRunners' | 'accountRunnerQuery' | 'runnerLinkError' | 'runnerLinkMessage'
  | 'suggestedRunners' | 'categoryLabel' | 'changeLanguage' | 'i18n' | 'apiOnline' | 'accountError'
  | 'confirmAccountDeletion' | 'deleteAccount' | 'login'>;

@Component({
  selector: 'app-account-settings',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DatePipe, FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatProgressSpinnerModule, ClubNamePipe, TranslatePipe],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.scss',
})
export class AccountSettings {
  readonly context = input.required<AccountSettingsContext>();
}
