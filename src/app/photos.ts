import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Reportages } from './reportages';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-photos',
  imports: [MatIconModule, TranslatePipe, Reportages],
  template: `
    <h1>{{ 'Médias' | t }}</h1>
    <section aria-labelledby="photos-title">
      <h2 class="section-title" id="photos-title">{{ 'Photos' | t }}</h2>
      <div class="intro" lang="fr">
        <p>L'Acrho ne propose pas la possibilité de visualiser sur son site les photos prises lors des différentes épreuves du challenge.</p>
        <p>Néanmoins, d’autres sites, gérés par quelques snipers bien connus, vous mettent à disposition leurs plus beaux résultats.</p>
      </div>

      <ul class="galleries">
        @for (gallery of galleries; track gallery.name) {
          <li>
            <figure>
              <img [src]="gallery.image" [class.logo]="gallery.logo" alt="" width="480" height="270" loading="lazy">
              @if (gallery.imageSource; as source) {
                <figcaption lang="fr">Photo d’illustration · <a [href]="source">Martins Zemlickis, Wikimedia Commons</a></figcaption>
              }
            </figure>
            <h3 translate="no">{{ gallery.name }}</h3>
            <div lang="fr">
              @for (paragraph of gallery.paragraphs; track paragraph) {
                <p>{{ paragraph }}</p>
              }
            </div>
            <div class="gallery-links">
              @for (link of gallery.links; track link.url) {
                <a [href]="link.url">
                  {{ link.label | t }}
                  <mat-icon aria-hidden="true">arrow_outward</mat-icon>
                </a>
              }
            </div>
          </li>
        }
      </ul>
    </section>
    <app-reportages />
  `,
  styles: `
    :host { display: block; color: var(--acrho-heading); }
    h1, h2, h3, p { margin: 0; }
    h1 { font: 800 clamp(1.8rem, 4vw, 2.65rem)/1.12 Manrope, sans-serif; }
    .section-title { margin-top: 1.25rem; font-size: 1.3rem; }
    .intro { max-width: 70ch; margin-block: 1rem 1.5rem; }
    h3 { margin-bottom: .5rem; font-size: 1.05rem; }
    p { color: var(--acrho-muted); font-size: .925rem; line-height: 1.55; }
    p + p { margin-top: .5rem; }
    .galleries {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
      gap: .8rem;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .galleries li {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      border: 1px solid var(--acrho-border);
      border-radius: .75rem;
      background: #fff;
    }
    figure { margin: 0 0 .75rem; }
    figure img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border-radius: .5rem;
      background: var(--acrho-soft);
    }
    figure img.logo { box-sizing: border-box; padding: 1.5rem; object-fit: contain; background: #fff; }
    figcaption { margin-top: .25rem; color: var(--acrho-muted); font-size: .75rem; }
    figcaption a { color: inherit; }
    .gallery-links {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      margin-top: auto;
      padding-top: .85rem;
    }
    .gallery-links a {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .4rem .65rem;
      border: 1px solid var(--acrho-border);
      border-radius: .5rem;
      color: var(--acrho-accent-dark);
      font-size: .875rem;
      font-weight: 700;
      text-decoration: none;
    }
    .gallery-links a:hover { border-color: var(--acrho-accent); }
    a:focus-visible { outline: 2px solid var(--acrho-accent-dark); outline-offset: 2px; }
    a mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
  `,
})
export class Photos {
  protected readonly galleries = [
    {
      name: 'L’Avenir',
      image: 'assets/sponsors/lavenir.jpg',
      logo: true,
      paragraphs: ['Le plus fidèle des mitrailleurs, Jean-Luc Debaisieux, président de l’ACRHO, vous propose ses meilleures photos sur le site de L’Avenir.'],
      links: [
        { label: 'Galeries de jogging', url: 'http://jogging.lavenir.net/category/galeries-photos/' },
        { label: 'WapiSport', url: 'http://www.facebook.com/lavenirwapisport' },
      ],
    },
    {
      name: 'Bernard Hache',
      image: 'assets/photos/bernard.webp',
      paragraphs: [
        'Pour une meilleure visibilité, Bernard partage ses albums du challenge sous un nouveau profil Facebook, BHCrossRunningPhotos.',
        'Allez jeter un œil sur les différents albums et likez ses plus belles prises :-)',
      ],
      links: [{ label: 'Voir les albums', url: 'https://www.facebook.com/groups/bhcrossrunningphotos' }],
    },
    {
      name: 'Dany Vandenhende',
      image: 'assets/photos/dany.webp',
      imageSource: 'https://commons.wikimedia.org/wiki/File:Brussels_marathon_runners_(Unsplash).jpg',
      paragraphs: ['Il mitraille l’ACRHO depuis un certain temps. Il est temps d’aller voir ses œuvres sur sa page Facebook.'],
      links: [{ label: 'Voir les albums', url: 'https://www.facebook.com/dany.vandenhende/photos_albums' }],
    },
    {
      name: 'Stéphanie Martinache',
      image: 'assets/photos/stephanie.webp',
      paragraphs: [
        'Nouvelle venue sur les routes de l’ACRHO, Stéphanie partage ses photos du challenge sur sa page Facebook.',
        'Visitez-la et adressez-lui mille commentaires :-)',
      ],
      links: [{ label: 'Voir les albums', url: 'https://www.facebook.com/stephanie.martinache.7/photos_albums' }],
    },
    {
      name: 'Fabrice Lefevre',
      image: 'assets/photos/fabrice.webp',
      paragraphs: ['Tout aussi attrayant, Fabrice vous propose ses clichés sur Facebook (profil indispensable).'],
      links: [{ label: 'Voir les albums', url: 'https://www.facebook.com/fabrice.lefevre.98/photos_albums' }],
    },
  ];
}
