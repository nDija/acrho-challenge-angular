import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-race-tips',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <h1>{{ 'Conseils' | t }}</h1>

    <div class="tips" lang="fr">
      <section aria-labelledby="waste-tip">
        <h2 id="waste-tip">Les déchets à la poubelle</h2>
        <p>Jetez vos déchets dans les poubelles mises à votre disposition.</p>
        <p>Évitez de vous délester des pipettes en pleine nature.</p>
        <p>Les bénévoles et la nature vous en seront reconnaissants.</p>
      </section>

      <section aria-labelledby="bib-tip">
        <h2 id="bib-tip">Dossard devant</h2>
        <p>Attachez correctement votre dossard devant vous.</p>
        <p>Cela améliorera la détection sur la ligne d’arrivée.</p>
        <p>Et vous passerez plus facilement sur les photos.</p>
      </section>

      <section aria-labelledby="registration-tip">
        <h2 id="registration-tip">Formulaire d’inscription</h2>
        <p>Pour gagner du temps lors de votre première participation aux courses de l’ACRHO, vous pouvez imprimer le formulaire et le remplir chez vous.</p>
        <a href="assets/acrho-inscription-2026-fr.pdf" download>
          <mat-icon aria-hidden="true">download</mat-icon>
          Télécharger le formulaire 2026 (PDF)
        </a>
      </section>
    </div>
  `,
  styles: `
    :host { display: block; color: var(--acrho-heading); }
    h1 { margin: 0 0 1.25rem; font: 800 clamp(1.8rem, 4vw, 2.65rem)/1.12 Manrope, sans-serif; }
    .tips { display: grid; gap: .75rem; max-width: 52rem; }
    section { padding: 1rem; border: 1px solid var(--acrho-border); border-radius: .75rem; background: #fff; }
    h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
    p { margin: .35rem 0 0; color: var(--acrho-muted); line-height: 1.5; }
    a { display: inline-flex; align-items: center; gap: .4rem; margin-top: .75rem; color: var(--acrho-accent-dark); font-weight: 700; }
    a mat-icon { flex: none; }
  `,
})
export class RaceTips {}
