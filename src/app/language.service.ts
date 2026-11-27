import { DOCUMENT, registerLocaleData } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { Language } from './translations';

const localeLoaders = {
  nl: () => import('@angular/common/locales/nl'),
  de: () => import('@angular/common/locales/de'),
  es: () => import('@angular/common/locales/es'),
};

async function loadDictionary(language: Language): Promise<ReadonlyMap<string, string>> {
  switch (language) {
    case 'fr': return new Map();
    case 'art-x-hvy': return (await import('./high-valyrian')).highValyrian;
    case 'tlh': {
      const [{ translations }, { klingon }] = await Promise.all([import('./translations'), import('./klingon')]);
      return new Map([...translations.map(row => [row[0], row[1]] as const), ...klingon]);
    }
    case 'en-x-tengwar': {
      const [{ translations }, { tengwar }] = await Promise.all([import('./translations'), import('./tengwar')]);
      return new Map([...translations.map(row => [row[0], row[1]] as const), ...tengwar]);
    }
    default: {
      const [{ translations }, locale] = await Promise.all([
        import('./translations'),
        language === 'en' ? undefined : localeLoaders[language](),
      ]);
      if (locale) registerLocaleData(locale.default);
      const index = { en: 1, nl: 2, de: 3, es: 4 }[language];
      return new Map(translations.map(row => [row[0], row[index]]));
    }
  }
}

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
  private readonly activeLanguage = signal<{ code: Language; dictionary: ReadonlyMap<string, string> }>({
    code: 'fr', dictionary: new Map(),
  });
  readonly language = computed(() => this.activeLanguage().code);
  private languageRequest = 0;
  readonly locale = computed(() => {
    const language = this.language();
    if (language === 'en-x-tengwar' || language === 'tlh') return 'en';
    return language === 'art-x-hvy' ? 'fr' : language;
  });
  private readonly document = inject(DOCUMENT);

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

  async initialize(): Promise<void> {
    await this.activateLanguage(this.savedLanguage());
  }

  async setLanguage(value: string): Promise<boolean> {
    const language = this.languages.find(option => option.value === value)?.value;
    if (!language || !await this.activateLanguage(language)) return false;
    if (this.theme() !== 'auto') this.setTheme('auto');
    try { localStorage.setItem('acrho-language', language); } catch { /* Storage may be unavailable. */ }
    return true;
  }

  private async activateLanguage(code: Language): Promise<boolean> {
    const request = ++this.languageRequest;
    if (code === this.language()) return false;
    try {
      const dictionary = await loadDictionary(code);
      if (request !== this.languageRequest) return false;
      this.activeLanguage.set({ code, dictionary });
      return true;
    } catch (error) {
      console.error('Could not load language', code, error);
      return false;
    }
  }

  t(value: string | null | undefined): string {
    if (!value) return '';
    if (value.startsWith('Erreur API (')) return value.replace('Erreur API', this.t('Erreur API'));
    return this.activeLanguage().dictionary.get(value) ?? value;
  }

  private savedLanguage(): Language {
    try {
      const saved = localStorage.getItem('acrho-language');
      return this.languages.find(language => language.value === saved)?.value ?? 'fr';
    } catch { /* Use French when storage is unavailable. */ }
    return 'fr';
  }
}
