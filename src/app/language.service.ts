import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { highValyrian } from './high-valyrian';
import { translations, type Language } from './translations';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly languages: readonly { value: Language; label: string }[] = [
    { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' },
    { value: 'nl', label: 'Nederlands' }, { value: 'de', label: 'Deutsch' },
    { value: 'art-x-hvy', label: 'Haut valyrien' },
  ];
  readonly language = signal<Language>(this.savedLanguage());
  readonly locale = computed(() => {
    const language = this.language();
    return language === 'art-x-hvy' ? 'fr' : language;
  });
  private readonly document = inject(DOCUMENT);
  private readonly dictionaries = new Map(translations.map(row => [row[0], row]));

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
    });
  }

  setLanguage(value: string) {
    if (!this.languages.some(language => language.value === value)) return;
    this.language.set(value as Language);
    try { localStorage.setItem('acrho-language', value); } catch { /* Storage may be unavailable. */ }
  }

  t(value: string | null | undefined): string {
    if (!value) return '';
    if (value.startsWith('Erreur API (')) return value.replace('Erreur API', this.t('Erreur API'));
    if (this.language() === 'art-x-hvy') return highValyrian.get(value) ?? value;
    const index = { fr: 0, en: 1, nl: 2, de: 3 }[this.locale()];
    return this.dictionaries.get(value)?.[index] ?? value;
  }

  private savedLanguage(): Language {
    try {
      const saved = localStorage.getItem('acrho-language');
      return this.languages.find(language => language.value === saved)?.value ?? 'fr';
    } catch { /* Use French when storage is unavailable. */ }
    return 'fr';
  }
}
