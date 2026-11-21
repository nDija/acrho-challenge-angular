import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-project-credits',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <h1>{{ 'Crédits' | t }}</h1>

    <section aria-labelledby="project-technologies">
      <h2 id="project-technologies">{{ 'Technologies du projet' | t }}</h2>
      <ul class="technology-list">
        @for (stack of technologies; track stack.name) {
          <li>
            <span class="avatar"><mat-icon aria-hidden="true">{{ stack.icon }}</mat-icon></span>
            <h3>{{ stack.name | t }}</h3>
            <ul class="technology-tools">
              @for (tool of stack.tools; track tool.name) {
                <li>
                  <img [src]="'assets/technologies/' + tool.logo" alt="" width="24" height="24" loading="lazy">
                  <span translate="no">{{ tool.name }}</span>
                </li>
              }
            </ul>
          </li>
        }
      </ul>
    </section>

    <section aria-labelledby="service-credits">
      <h2 id="service-credits">{{ 'Services et crédits' | t }}</h2>
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
    .technology-list > li, .credit-list a {
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
    .technology-list h3 { align-self: center; }
    .technology-tools {
      grid-column: 1 / -1;
      display: flex;
      flex-wrap: wrap;
      gap: .65rem .9rem;
      align-self: end;
      padding-top: .65rem;
      border-top: 1px solid var(--acrho-border);
    }
    .technology-tools li {
      display: inline-flex;
      align-items: center;
      gap: .25rem;
      color: var(--acrho-muted);
      font-size: .8rem;
    }
    .technology-tools img { flex: none; object-fit: contain; }
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
export class ProjectCredits {
  protected readonly technologies = [
    {
      name: 'Application web',
      icon: 'web',
      tools: [
        { name: 'Angular', logo: 'angular.svg' },
        { name: 'Angular Material', logo: 'angularmaterial.svg' },
        { name: 'TypeScript', logo: 'typescript.svg' },
        { name: 'RxJS', logo: 'rxjs.svg' },
        { name: 'Chart.js', logo: 'chartjs.svg' },
      ],
    },
    {
      name: 'Application mobile Android et iOS (projet)',
      icon: 'smartphone',
      tools: [
        { name: 'Kotlin Multiplatform', logo: 'kotlin-multiplatform.svg' },
        { name: 'Compose Multiplatform', logo: 'compose-multiplatform.svg' },
        { name: 'Ktor', logo: 'ktor.svg' },
      ],
    },
    {
      name: 'API commune',
      icon: 'dns',
      tools: [
        { name: 'Java', logo: 'java.svg' },
        { name: 'Spring Boot', logo: 'springboot.svg' },
        { name: 'PostgreSQL', logo: 'postgresql.svg' },
        { name: 'Flyway', logo: 'flyway.svg' },
      ],
    },
    {
      name: 'Hébergement et déploiement',
      icon: 'dns',
      tools: [
        { name: 'GitHub', logo: 'github.svg' },
        { name: 'Docker', logo: 'docker.svg' },
        { name: 'Raspberry Pi', logo: 'raspberrypi.svg' },
        { name: 'Linux', logo: 'linux.svg' },
      ],
    },
    {
      name: 'Assistants IA',
      icon: 'smart_toy',
      tools: [
        { name: 'Claude', logo: 'claude.svg' },
        { name: 'Codex', logo: 'codex.svg' },
        { name: 'ChatGPT', logo: 'chatgpt.png' },
      ],
    },
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
