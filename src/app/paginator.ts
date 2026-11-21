import { Component, input, output } from '@angular/core';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { localizedPaginatorProvider } from './paginator-intl';

@Component({
  selector: 'app-paginator',
  imports: [MatPaginatorModule],
  providers: [localizedPaginatorProvider],
  template: `
    <mat-paginator
      [attr.aria-label]="label()"
      [length]="length()"
      [pageSize]="pageSize()"
      [pageIndex]="pageIndex()"
      [pageSizeOptions]="pageSizeOptions()"
      [hidePageSize]="hidePageSize()"
      (page)="page.emit($event)"
    />
  `,
})
export class Paginator {
  readonly label = input<string>();
  readonly length = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSizeOptions = input<number[]>([]);
  readonly hidePageSize = input(false);
  readonly page = output<PageEvent>();
}
