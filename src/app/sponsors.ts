import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-sponsors',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <header>
      <h1>{{ 'Sponsors' | t }}</h1>
    </header>

    <section aria-labelledby="sponsor-technologies">
      <h2 id="sponsor-technologies">{{ 'Technologies du projet' | t }}</h2>
      <ul class="technology-list">
        @for (stack of technologies; track stack.name) {
          <li>
            <span class="avatar"><mat-icon aria-hidden="true">{{ stack.icon }}</mat-icon></span>
            <div>
              <h3>{{ stack.name | t }}</h3>
              <p>{{ stack.tools }}</p>
            </div>
          </li>
        }
      </ul>
    </section>

    <section aria-labelledby="sponsor-credits">
      <h2 id="sponsor-credits">{{ 'Services et crédits' | t }}</h2>
      <ul class="credit-list">
        @for (credit of credits; track credit.name) {
          <li>
            <a [href]="credit.url">
              <span class="avatar"><img [src]="'assets/sponsors/' + credit.image" alt="" width="28" height="28"></span>
              <div>
                <h3 translate="no">{{ credit.name }}</h3>
                <p>{{ credit.description | t }}</p>
              </div>
              <mat-icon class="external-icon" aria-hidden="true">arrow_outward</mat-icon>
            </a>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    :host { display: block; color: var(--acrho-heading); }
    h1, h2, h3, p { margin: 0; }
    h1 { font: 800 clamp(1.8rem, 4vw, 2.65rem)/1.12 Manrope, sans-serif; }
    h2 { margin-bottom: .8rem; font-size: 1.15rem; }
    h3 { font-size: 1rem; }
    p { margin-top: .3rem; color: var(--acrho-muted); font-size: .875rem; line-height: 1.45; }
    section { margin-top: 1.75rem; }
    ul {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
      gap: .8rem;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .technology-list li, .credit-list a {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: .75rem;
      box-sizing: border-box;
      height: 100%;
      padding: 1rem;
      border: 1px solid var(--acrho-border);
      border-radius: .75rem;
      background: #fff;
    }
    .credit-list a {
      grid-template-columns: auto minmax(0, 1fr) auto;
      color: inherit;
      text-decoration: none;
    }
    .credit-list a:hover { border-color: var(--acrho-accent); }
    .credit-list a:focus-visible { outline: 2px solid var(--acrho-accent-dark); outline-offset: 2px; }
    .avatar {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: .65rem;
      background: var(--acrho-soft);
      color: var(--acrho-accent-dark);
    }
    .avatar img { object-fit: contain; }
    .external-icon { width: 1rem; height: 1rem; font-size: 1rem; color: var(--acrho-accent-dark); }
  `,
})
export class Sponsors {
  protected readonly technologies = [
    { name: 'Application web', icon: 'web', tools: 'Angular · Angular Material · TypeScript · RxJS · Chart.js' },
    { name: 'Application mobile Android et iOS', icon: 'smartphone', tools: 'Kotlin Multiplatform · Compose Multiplatform · Ktor' },
    { name: 'API commune', icon: 'dns', tools: 'Java · Spring Boot · PostgreSQL · Flyway · Docker' },
  ];

  protected readonly credits = [
    {
      name: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      image: 'open-meteo.ico',
      description: 'Prévisions au départ des courses et données météo historiques.',
    },
    {
      name: 'OpenRunner',
      url: 'https://www.openrunner.com/',
      image: 'openrunner.ico',
      description: 'Tracés des parcours depuis les fiches des courses.',
    },
    {
      name: 'Wikimedia Commons',
      url: 'https://commons.wikimedia.org/',
      image: 'wikimedia-commons.png',
      description: 'Photos des lieux de course. L’auteur et la licence figurent sur chaque photo.',
    },
    {
      name: 'Pngtree',
      url: 'https://pngtree.com/',
      image: 'pngtree.ico',
      description: 'Ressources graphiques.',
    },
  ];
}
