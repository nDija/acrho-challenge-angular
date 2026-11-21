import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from './translate.pipe';
import type { App } from './app';

type ViewContext = Pick<App, 'runnerQuery' | 'runnerSearchMode' | 'setRunnerSearchMode' | 'onRunnerQueryChange' | 'findRunners'>;

@Component({
  selector: 'app-runner-search',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './runner-search.html',
  styles: ['mat-button-toggle-group { display: flex; width: fit-content; margin-bottom: 12px; } mat-form-field { width: min(100%, 520px); }'],
})
export class RunnerSearch {
  readonly context = input.required<ViewContext>();
}
