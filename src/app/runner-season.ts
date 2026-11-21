import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from './translate.pipe';
import type { App } from './app';

type ViewContext = Pick<App, 'runnerYear' | 'runnerDetailLoading' | 'runnerSeasons' | 'loadRunnerResults'>;

@Component({
  selector: 'app-runner-season',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './runner-season.html',
  styles: ['mat-form-field { width: 100%; }'],
})
export class RunnerSeason {
  readonly context = input.required<ViewContext>();
}
