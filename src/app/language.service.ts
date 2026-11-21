import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { highValyrian } from './high-valyrian';
import { klingon } from './klingon';
import { tengwar } from './tengwar';
import { translations, type Language } from './translations';

const themes = [
  { value: 'auto', label: 'Thème automatique' },
  { value: 'azure-blue', label: 'Bleu azur' },
  { value: 'rose-red', label: 'Rose et rouge' },
  { value: 'cyan-orange', label: 'Cyan et orange (sombre)' },
  { value: 'magenta-violet', label: 'Magenta et violet (sombre)' },
  { value: 'indigo-pink', label: 'Indigo et rose' },
  { value: 'valyrian-red', label: 'Noir et rouge' },
  { value: 'klingon-red', label: 'Rouge et noir' },
  { value: 'elvish-emerald', label: 'Émeraude et or' },
] as const;

type ThemePreference = typeof themes[number]['value'];
const materialThemes: ReadonlySet<string> = new Set(['azure-blue', 'rose-red', 'cyan-orange', 'magenta-violet', 'indigo-pink']);

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly languages: readonly { value: Language; label: string }[] = [
    { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' },
    { value: 'nl', label: 'Nederlands' }, { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'art-x-hvy', label: 'Haut valyrien' },
    { value: 'en-x-tengwar', label: 'Elfique' },
    { value: 'tlh', label: 'tlhIngan Hol' },
  ];
  readonly themes = themes;
  private readonly themePreference = signal<ThemePreference>(this.savedTheme());
  readonly theme = this.themePreference.asReadonly();
  readonly language = signal<Language>(this.savedLanguage());
  readonly locale = computed(() => {
    const language = this.language();
    if (language === 'en-x-tengwar' || language === 'tlh') return 'en';
    return language === 'art-x-hvy' ? 'fr' : language;
  });
  private readonly document = inject(DOCUMENT);
  private readonly dictionaries = new Map(translations.map(row => [row[0], row]));

  constructor() {
    effect(() => {
      const language = this.language();
      const root = this.document.documentElement;
      root.lang = language === 'en-x-tengwar' ? 'en' : language;
      root.dataset['acrhoLanguage'] = language;
      const preference = this.theme();
      const activeTheme = preference !== 'auto' ? preference
        : language === 'art-x-hvy' ? 'valyrian-red'
        : language === 'en-x-tengwar' ? 'elvish-emerald'
        : language === 'tlh' ? 'klingon-red'
        : 'azure-blue';
      root.dataset['acrhoTheme'] = activeTheme;
      const materialTheme = materialThemes.has(activeTheme) ? activeTheme
        : activeTheme === 'valyrian-red' ? 'cyan-orange'
        : 'azure-blue';
      const stylesheet = this.document.getElementById('material-theme');
      const href = `assets/material-themes/${materialTheme}.css`;
      if (stylesheet && stylesheet.getAttribute('href') !== href) stylesheet.setAttribute('href', href);
    });
  }

  setTheme(value: ThemePreference) {
    this.themePreference.set(value);
    try { localStorage.setItem('acrho-theme', value); } catch { /* Storage may be unavailable. */ }
  }

  private savedTheme(): ThemePreference {
    try {
      const saved = localStorage.getItem('acrho-theme');
      return themes.find(theme => theme.value === saved)?.value ?? 'auto';
    } catch { return 'auto'; }
  }

  setLanguage(value: string) {
    if (this.language() === value || !this.languages.some(language => language.value === value)) return;
    this.language.set(value as Language);
    if (this.theme() !== 'auto') this.setTheme('auto');
    try { localStorage.setItem('acrho-language', value); } catch { /* Storage may be unavailable. */ }
  }

  t(value: string | null | undefined): string {
    if (!value) return '';
    if (value.startsWith('Erreur API (')) return value.replace('Erreur API', this.t('Erreur API'));
    if (this.language() === 'art-x-hvy') return highValyrian.get(value) ?? value;
    const index = { fr: 0, en: 1, nl: 2, de: 3, es: 4 }[this.locale()];
    const translated = this.dictionaries.get(value)?.[index] ?? value;
    if (this.language() === 'tlh') return klingon.get(value) ?? translated;
    return this.language() === 'en-x-tengwar' ? tengwar.get(value) ?? translated : translated;
  }

  private savedLanguage(): Language {
    try {
      const saved = localStorage.getItem('acrho-language');
      return this.languages.find(language => language.value === saved)?.value ?? 'fr';
    } catch { /* Use French when storage is unavailable. */ }
    return 'fr';
  }
}
