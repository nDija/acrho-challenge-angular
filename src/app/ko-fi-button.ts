import { Component } from '@angular/core';

@Component({
  selector: 'app-ko-fi-button',
  template: `
    <a class="support-button" href="https://ko-fi.com/K1U42B5I05" target="_blank" rel="noopener">
      <img src="assets/sponsors/ko-fi.png" alt="" width="24" height="24">
      Support me on Ko-fi
    </a>
  `,
  styles: `
    :host { display: flex; }
    .support-button {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      min-height: 40px;
      padding: .5rem .85rem;
      border-radius: .65rem;
      background: #72a4f2;
      color: #12233e;
      font-weight: 700;
      text-decoration: none;
    }
    .support-button img { object-fit: contain; }
    .support-button:hover { text-decoration: underline; }
    .support-button:focus-visible { outline: 2px solid var(--acrho-accent-dark); outline-offset: 2px; }
  `,
})
export class KoFiButton {}
