import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from './translate.pipe';
import type { App } from './app';

type ViewContext = Pick<App, 'runnerYear' | 'runnerDetailLoading' | 'runnerSeasons' | 'loadRunnerResults'>;

@Component({
  selector: 'app-runner-season',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, FormsModule],
  templateUrl: './runner-season.html',
  styles: `
    :host { display: block; width: 100%; min-width: 0; }
  `,
})
export class RunnerSeason {
  readonly context = input.required<ViewContext>();
}
