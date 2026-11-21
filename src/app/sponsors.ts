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

    <section aria-labelledby="official-sponsors">
      <h2 id="official-sponsors">{{ 'Sponsors officiels de l’ACRHO' | t }}</h2>
      <ul class="official-list">
        @for (sponsor of officialSponsors; track sponsor.name) {
          <li>
            <div class="sponsor-logo">
              <img [src]="'assets/sponsors/' + sponsor.image" alt="" width="224" height="96" loading="lazy">
            </div>
            <h3 translate="no">
              @if (sponsor.url; as url) {
                <a [href]="url">{{ sponsor.name }}</a>
              } @else {
                {{ sponsor.name }}
              }
            </h3>
            <p>{{ sponsor.description | t }}</p>
          </li>
        }
      </ul>
    </section>

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
    .official-list li {
      position: relative;
      padding: 1rem;
      border: 1px solid var(--acrho-border);
      border-radius: .75rem;
      background: #fff;
    }
    .sponsor-logo {
      display: grid;
      place-items: center;
      margin-bottom: .75rem;
      background: #fff;
    }
    .sponsor-logo img { width: 100%; height: 6rem; object-fit: contain; }
    .official-list a { color: inherit; text-decoration: none; }
    .official-list a::after { content: ''; position: absolute; inset: 0; border-radius: .75rem; }
    .official-list a:hover { text-decoration: underline; }
    .official-list li:focus-within { outline: 2px solid var(--acrho-accent-dark); outline-offset: 2px; }

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
  protected readonly officialSponsors: readonly { name: string; image: string; url?: string; description: string }[] = [
    {
      name: "Thiebaut",
      image: "thiebaut.jpg",
      url: "http://www.thiebaut.be/",
      description: "Matériaux – location de matériel – terrassement – transport",
    },
    {
      name: "L’Avenir",
      image: "lavenir.jpg",
      url: "http://www.lavenir.net/",
      description: "Presse quotidienne",
    },
    {
      name: "Horta",
      image: "horta.jpg",
      url: "https://www.horta.org/fr",
      description: "Jardinerie – animalerie – décoration",
    },
    {
      name: "Fabrice Hennecard",
      image: "fabrice-hennecard.gif",
      url: "http://www.fabrice-hannecard.be/Accueil.htm",
      description: "Arboriste grimpeur",
    },
    {
      name: "Luc Sports",
      image: "luc-sports.jpg",
      description: "Vente de matériel sportif",
    },
    {
      name: "Maes - Airco",
      image: "maes-airco.jpg",
      url: "http://www.maesairco.be/",
      description: "Climatisation – pompe à chaleur – cave à vin – réfrigération",
    },
    {
      name: "Garage Dejonckheere",
      image: "garage-dejonckheere.jpg",
      url: "http://www.mini.be/",
      description: "Concessionnaire MINI",
    },
    {
      name: "Anti-Chute",
      image: "anti-chute.png",
      url: "http://anti-chute.be/fr/",
      description: "Textile personnalisé et équipement de protection individuelle",
    },
    {
      name: "PRImmo",
      image: "primmo.png",
      url: "https://primmo.be/",
      description: "Agence immobilière",
    },
    {
      name: "Rudi Kilowatts",
      image: "rudi-kilowatts.jpg",
      url: "https://rudikilowatts.be/",
      description: "Électricité, nouvelle installation, rénovation et remise en conformité",
    },
    {
      name: "Optimum Training",
      image: "optimum-training.png",
      url: "https://www.optimumtraining.be/",
      description: "Laboratoire de physiologie de l’effort et du métabolisme au repos et à l’effort. Eric Navez, Sophie Houdou et Christophe Dauge vous accompagnent.",
    },
    {
      name: "Brasserie Caulier",
      image: "brasserie-caulier.png",
      url: "https://www.brasseriecaulier.beer/",
      description: "Brasserie de Péruwelz qui produit notamment la Paix Dieu, la Bonsecours et la Stuut.",
    },
    {
      name: "Ethias",
      image: "ethias.jpg",
      url: "https://www.ethias.be/part/fr.html",
      description: "Assurances, gestion des risques et investissement durable.",
    },
  ];

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
