import { Component } from '@angular/core';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-sponsors',
  imports: [TranslatePipe],
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
              <img [src]="'assets/sponsors/' + sponsor.image" [class.logo-dark]="sponsor.darkBackground" alt="" width="224" height="96" loading="lazy">
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

    <section aria-labelledby="personal-thanks">
      <h2 id="personal-thanks">{{ 'Remerciements personnels' | t }}</h2>
      <ul class="official-list acknowledgements">
        <li>
          <div class="sponsor-logo">
            <img src="assets/sponsors/cocoach.png" alt="" width="224" height="96" loading="lazy">
          </div>
          <h3 translate="no"><a href="https://cocoach.be/">Cocoach</a></h3>
        </li>
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
    .acknowledgements { max-width: 17rem; }
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
    .sponsor-logo img.logo-dark { box-sizing: border-box; padding: .25rem; background: #000; }
    .official-list a { color: inherit; text-decoration: none; }
    .official-list a::after { content: ''; position: absolute; inset: 0; border-radius: .75rem; }
    .official-list li:focus-within { outline: 2px solid var(--acrho-accent-dark); outline-offset: 2px; }
    .official-list li:has(a:hover) { border-color: var(--acrho-accent); }
  `,
})
export class Sponsors {
  protected readonly officialSponsors: readonly { name: string; image: string; url?: string; description: string; darkBackground?: boolean }[] = [
    {
      name: "Thiebaut",
      image: "thiebaut.png",
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
      name: "Fabrice Hannecard",
      image: "fabrice-hennecard.gif",
      url: "https://www.facebook.com/p/Fabrice-Hannecard-100046919846508/",
      description: "Arboriste grimpeur",
    },
    {
      name: "Luc Sports",
      image: "luc-sports.jpg",
      url: "https://www.facebook.com/Luc.sports.magasindesport/?locale=fr_FR",
      description: "Vente de matériel sportif",
    },
    {
      name: "Maes - Airco",
      image: "maes-airco.png",
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
      darkBackground: true,
      url: "https://primmo.be/",
      description: "Agence immobilière",
    },
    {
      name: "Rudi Kilowatts",
      image: "rudi-kilowatts.png",
      url: "https://rudikilowatts.be/",
      description: "Électricité, nouvelle installation, rénovation et remise en conformité",
    },
    {
      name: "Optimum Training",
      image: "optimum-training.jpg",
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
}
