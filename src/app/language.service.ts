import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Language, translations } from './translations';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly languages: readonly { value: Language; label: string }[] = [
    { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' },
    { value: 'nl', label: 'Nederlands' }, { value: 'de', label: 'Deutsch' },
  ];
  readonly language = signal<Language>(this.savedLanguage());
  readonly locale = computed(() => this.language());
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
    const index = { fr: 0, en: 1, nl: 2, de: 3 }[this.language()];
    return this.dictionaries.get(value)?.[index] ?? value;
  }

  private savedLanguage(): Language {
    try {
      const saved = localStorage.getItem('acrho-language');
      if (saved === 'en' || saved === 'nl' || saved === 'de') return saved;
    } catch { /* Use French when storage is unavailable. */ }
    return 'fr';
  }
}
