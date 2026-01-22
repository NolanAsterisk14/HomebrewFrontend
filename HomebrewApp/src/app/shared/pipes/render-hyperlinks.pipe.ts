import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { KeyTerm } from '../models/key-term.model';

@Pipe({
  name: 'renderHyperlinks',
  standalone: true
})
export class RenderHyperlinksPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string | null | undefined, terms: KeyTerm[]): SafeHtml {
    if (!text) {
      return '';
    }

    let result = text;

    // Sort terms by length (longest first) to avoid nested replacements
    const sortedTerms = [...terms].sort((a, b) => b.name.length - a.name.length);

    sortedTerms.forEach((term) => {
      // Create a case-insensitive regex that matches whole words
      const regex = new RegExp(`\\b${this.escapeRegex(term.name)}\\b`, 'gi');
      result = result.replace(
        regex,
        `<span class="key-term-link" data-term-id="${term.id}" title="${this.escapeHtml(term.definition)}">${term.name}</span>`
      );
    });

    return this.sanitizer.bypassSecurityTrustHtml(result);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
