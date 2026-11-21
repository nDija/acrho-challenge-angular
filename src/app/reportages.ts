import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LanguageService } from './language.service';
import { TranslatePipe } from './translate.pipe';
import { REPORTAGE_ARCHIVES } from './reportage-archives';

@Component({
  selector: 'app-reportages',
  imports: [DatePipe, MatIconModule, TranslatePipe],
  template: `
    <section aria-labelledby="reportages-title">
      <h2 id="reportages-title">{{ 'Reportages' | t }}</h2>
      <label for="reportage-year">{{ 'Année des reportages' | t }}</label>
      <select id="reportage-year" #year [value]="selectedYear()" (change)="selectYear(year.value)">
        @for (archive of archives; track archive.year) {
          <option [value]="archive.year">{{ archive.year }}</option>
        }
      </select>
      <ul>
        @for (reportage of reportages(); track reportage.title) {
          <li>
            <a [href]="reportage.url">
              <img class="publisher-logo" src="assets/photos/notele.png"
                   alt="" width="44" height="44">
              <div>
                <h3 lang="fr">{{ reportage.title }}</h3>
                <div class="reportage-meta">
                  <span translate="no">notélé</span>
                  <time [attr.datetime]="reportage.publishedOn">{{ reportage.publishedOn | date:'longDate':undefined:i18n.locale() }}</time>
                </div>
              </div>
              <mat-icon class="external" aria-hidden="true">arrow_outward</mat-icon>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    :host { display: block; margin-top: 2rem; }
    h2 { margin: 0 0 .75rem; font-size: 1.3rem; }
    label { margin-inline-end: .5rem; font-weight: 700; }
    select {
      padding: .4rem .6rem;
      border: 1px solid var(--acrho-border);
      border-radius: .5rem;
      background: #fff;
      color: inherit;
      font: inherit;
    }
    ul {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: .75rem;
      margin: .9rem 0 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: .75rem;
      box-sizing: border-box;
      height: 100%;
      padding: .9rem;
      border: 1px solid var(--acrho-border);
      border-radius: .75rem;
      background: #fff;
      color: inherit;
      text-decoration: none;
    }
    a:hover { border-color: var(--acrho-accent); }
    a:focus-visible, select:focus-visible { outline: 2px solid var(--acrho-accent-dark); outline-offset: 2px; }
    h3 { margin: 0 0 .25rem; font-size: .95rem; }
    .reportage-meta { display: flex; flex-wrap: wrap; gap: .25rem .65rem; color: var(--acrho-muted); font-size: .8rem; }
    .publisher-logo { object-fit: contain; }
    mat-icon { color: var(--acrho-accent-dark); }
    .external { width: 1rem; height: 1rem; font-size: 1rem; }
  `,
})
export class Reportages {
  protected readonly i18n = inject(LanguageService);
  protected readonly archives = REPORTAGE_ARCHIVES;
  protected readonly selectedYear = signal(this.archives[0].year);
  protected readonly reportages = computed(() =>
    this.archives.find(archive => archive.year === this.selectedYear())?.items ?? [],
  );

  protected selectYear(year: string): void {
    this.selectedYear.set(Number(year));
  }
}
