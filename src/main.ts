import { registerLocaleData } from '@angular/common';
import fr from '@angular/common/locales/fr';
import en from '@angular/common/locales/en';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

for (const locale of [fr, en]) registerLocaleData(locale);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
