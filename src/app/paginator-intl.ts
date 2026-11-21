import { effect, inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { LanguageService } from './language.service';

@Injectable()
export class LocalizedPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(LanguageService);

  constructor() {
    super();
    effect(() => {
      this.itemsPerPageLabel = this.i18n.t('Éléments par page');
      this.nextPageLabel = this.i18n.t('Page suivante');
      this.previousPageLabel = this.i18n.t('Page précédente');
      this.firstPageLabel = this.i18n.t('Première page');
      this.lastPageLabel = this.i18n.t('Dernière page');
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, size: number, length: number) => {
    const start = length === 0 || size === 0 ? 0 : page * size + 1;
    const end = Math.min((page + 1) * size, length);
    return `${start}–${end} ${this.i18n.t('sur')} ${length}`;
  };
}

export const localizedPaginatorProvider = {
  provide: MatPaginatorIntl,
  useClass: LocalizedPaginatorIntl,
};
