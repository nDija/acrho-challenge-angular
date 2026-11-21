import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-race-registration',
  imports: [MatIconModule, TranslatePipe],
  template: `
    <article lang="fr">
      <h1>{{ 'Inscription' | t }} ACRHO 2026</h1>
      <p class="screen-only">Remplissez la fiche dans votre navigateur, puis imprimez-la et signez-la pour la remettre sur place. Les données saisies ne sont pas envoyées au serveur.</p>
      <p class="screen-only"><a href="assets/acrho-inscription-2026-fr.pdf" download>Télécharger le formulaire officiel (PDF)</a></p>

      <section aria-labelledby="registration-rules">
        <h2 id="registration-rules">À lire avant de remplir la fiche</h2>
        <ul>
          <li>Une inscription par an suffit. Le numéro de dossard et le club renseigné restent valables pour toute la saison.</li>
          <li>En 2026, la première inscription coûte 6 € pour les nouveaux inscrits. Les courses suivantes coûtent 5 €, comme chaque course pour les coureurs classés en 2025. Le remplacement d’un dossard endommagé coûte 6 €.</li>
          <li>Portez le dossard sur la poitrine, partez derrière la ligne pour être détecté et restituez le dossard après chaque course, même en cas d’abandon. Le classement utilise le temps net. Les réclamations se font via le site dans les 15 jours.</li>
          <li>Âge minimum de 10 ans pour 8 km, 12 ans pour 12 km et 16 ans à partir de 15 km. Les chiens et les poussettes sont interdits sur le parcours.</li>
          <li>L’organisateur peut annuler l’épreuve en cas de force majeure ou si la sécurité est compromise. Consultez le <a href="https://www.acrho.org/web/reglement/1011306065/list1187970089/f1.html">règlement de l’ACRHO</a>.</li>
        </ul>
      </section>

      <form #registrationForm ngNoForm (input)="refreshValidity(registrationForm)"
            (change)="refreshValidity(registrationForm)" (submit)="print($event)">
        <h2>Fiche d’inscription</h2>
        <p class="screen-only">Les champs marqués d’un astérisque sont obligatoires.</p>
        <div class="fields">
          <label>Numéro de dossard <input type="text" readonly aria-describedby="bib-number-note">
            <small id="bib-number-note" class="screen-only">Réservé à l’organisation.</small>
          </label>
          <label>Date de naissance * <input type="date" [max]="latestBirthDate" required></label>
          <label>Nom * <input type="text" required autocomplete="family-name"></label>
          <label>Prénom * <input type="text" required autocomplete="given-name"></label>
          <label>Club <input type="text"></label>
          <label>E-mail <input type="email" autocomplete="email"></label>
          <fieldset>
            <legend>Sexe *</legend>
            <label><input type="radio" name="sexe" value="homme" required> Homme</label>
            <label><input type="radio" name="sexe" value="femme" required> Femme</label>
          </fieldset>
          <label>Taille *
            <select required>
              <option value="">—</option>
              @for (size of sizes; track size) { <option [value]="size">{{ size }}</option> }
            </select>
          </label>
        </div>
        <p>Je déclare avoir pris connaissance des informations ci-dessus. Je déclare être physiquement apte à la pratique de la course à pied en compétition et dégage les organisateurs de toute responsabilité.</p>
        <p><strong>Droit à l’image</strong> — J’autorise l’ACRHO asbl à prendre des photos de moi avant, pendant et après l’une des courses organisées par celle-ci. Je renonce à toute rémunération et droit à la propriété du fait des utilisations des photos réalisées. Ces photos seront prises par l’un des photographes de l’ACRHO asbl dont le nom est repris sur <a href="https://www.acrho.org/">acrho.org</a>. L’ACRHO asbl s’engage à faire de ce droit un usage promotionnel et non commercial.</p>
        <div class="fields signatures">
          <label>Date d’inscription * <input type="date" [value]="registrationDate" required></label>
          <div class="signature">Signature obligatoire<span aria-hidden="true"></span></div>
        </div>
        <button class="screen-only" type="submit" [disabled]="!formValid()"><mat-icon aria-hidden="true">print</mat-icon> Imprimer la fiche</button>
      </form>
    </article>
  `,
  styles: `
    :host { display: block; color: var(--acrho-heading); }
    article { max-width: 52rem; }
    h1 { margin: 0 0 1rem; font: 800 clamp(1.8rem, 4vw, 2.65rem)/1.12 Manrope, sans-serif; }
    h2 { margin: 0 0 .5rem; font-size: 1.15rem; }
    p, li { line-height: 1.5; }
    a { color: var(--acrho-accent-dark); }
    section, form { margin: 1rem 0; padding: 1rem; border: 1px solid var(--acrho-border); border-radius: .75rem; background: #fff; }
    ul { margin: .5rem 0 0; padding-inline-start: 1.2rem; }
    li + li { margin-top: .35rem; }
    .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: .75rem 1rem; }
    .fields label, .signature { min-width: 0; font-weight: 600; }
    .fields input:not([type="radio"]), select { display: block; width: 100%; min-height: 2.5rem; margin-top: .25rem; padding: .35rem .5rem; border: 1px solid var(--acrho-border); border-radius: .4rem; background: #fff; color: inherit; font: inherit; }
    fieldset { margin: 0; padding: 0; border: 0; }
    fieldset label { display: inline-block; margin: .25rem .75rem .25rem 0; }
    .signature span { display: block; height: 2.5rem; border-bottom: 1px solid currentColor; }
    button { display: inline-flex; align-items: center; gap: .4rem; margin-top: 1rem; padding: .55rem .85rem; border: 1px solid var(--acrho-accent-dark); border-radius: .5rem; background: var(--acrho-accent-dark); color: #fff; font: inherit; cursor: pointer; }
    button mat-icon { color: #fff; }
    button:disabled { background: #e5e7eb; border-color: #d1d5db; color: #59636d; cursor: not-allowed; }
    button:disabled mat-icon { color: inherit; }
    @media print {
      :host { color: #000; font-size: 10pt; }
      article { max-width: none; padding: 11mm 12mm; }
      h1 { font-size: 18pt; }
      section, form { margin: 0 0 .7rem; padding: 0; border: 0; }
      .screen-only { display: none; }
      .fields { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .25rem 1rem; }
      .fields input:not([type="radio"]), select { min-height: 1.5rem; padding: .1rem .3rem; color: #000; border-color: #777; }
      .signatures { break-inside: avoid; }
    }
  `,
})
export class RaceRegistration {
  protected readonly sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  protected readonly registrationDate = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Brussels', dateStyle: 'short',
  }).format(new Date());
  protected readonly latestBirthDate = this.birthDateLimit(this.registrationDate);
  protected readonly formValid = signal(false);

  private birthDateLimit(today: string): string {
    const cutoff = new Date(today + 'T00:00:00Z');
    const month = cutoff.getUTCMonth();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 10);
    if (cutoff.getUTCMonth() !== month) cutoff.setUTCDate(0);
    return cutoff.toISOString().slice(0, 10);
  }

  protected refreshValidity(form: HTMLFormElement): void {
    this.formValid.set(form.matches(':valid'));
  }

  protected print(event: Event): void {
    event.preventDefault();
    window.print();
  }
}
