import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-regulation',
  imports: [MatIconModule, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './regulation.html',
  styleUrl: './regulation.scss',
})
export class Regulation {
  readonly markdown = input.required<string>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string>();

  protected readonly html = computed(() => this.renderRegulationMarkdown(this.markdown()));

  private renderRegulationMarkdown(markdown: string): string {
    const categoryLine = /^(ED|DA|A[1-4]|EH|SE|V[1-5])\s/;
    return markdown.replace(/\r/g, '').trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      const heading = lines.length === 1 ? /^(#{1,3})\s+(.+)$/.exec(lines[0]) : null;
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${this.regulationInline(heading[2])}</h${level}>`;
      }
      if (lines.every(line => categoryLine.test(line))) {
        return `<ul class="regulation-categories">${lines.map(line => `<li>${this.regulationInline(line.replace(/^[A-Z][A-Z0-9]*\s+\(([^)]+)\)/, '$1'))}</li>`).join('')}</ul>`;
      }
      if (lines[0].startsWith('**Conditions d’âge:**') || lines[0].startsWith("**Conditions d'âge:**")) {
        return `<h2>Conditions d’âge</h2><p>${lines.slice(1).map(line => this.regulationInline(line)).join('<br>')}</p>`;
      }
      if (lines.length === 1 && lines[0].startsWith('Formule de l’attribution des points:')) {
        return `<h2>${this.regulationInline(lines[0])}</h2>`;
      }
      if (lines.length === 1 && lines[0].startsWith('Points =')) {
        return `<div class="regulation-formula"><code>${this.regulationInline(lines[0])}</code></div>`;
      }
      return `<p>${lines.map(line => this.regulationInline(line)).join('<br>')}</p>`;
    }).join('');
  }
  private regulationInline(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
}
