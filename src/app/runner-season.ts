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
    label { display: grid; gap: 4px; color: var(--acrho-muted); font-size: 12px; }
    select { width: 100%; min-width: 0; min-height: 44px; border: 1px solid var(--acrho-border);
      border-radius: 7px; padding: 2px; background: var(--acrho-surface, #fff); color: var(--acrho-heading); font: inherit; }
    select:focus-visible { outline: 2px solid var(--acrho-accent); outline-offset: 2px; }
  `,
})
export class RunnerSeason {
  readonly context = input.required<ViewContext>();
}
