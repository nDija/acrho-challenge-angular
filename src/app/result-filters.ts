import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from './translate.pipe';
import type { App } from './app';

type ViewContext = Pick<App, 'resultQuery' | 'applyResultFilters' | 'category' | 'categories' | 'gender'>;

@Component({
  selector: 'app-result-filters',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './result-filters.html',
  styleUrl: './result-filters.scss',
})
export class ResultFilters {
  readonly context = input.required<ViewContext>();
}
