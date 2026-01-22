import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeyTerm } from '../shared/models/key-term.model';

@Injectable({
  providedIn: 'root'
})
export class KeyTermService {
  private readonly apiUrl = '/api/key-terms';

  keyTerms = signal<KeyTerm[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.loadKeyTerms();
  }

  loadKeyTerms(): void {
    this.isLoading.set(true);
    this.http.get<KeyTerm[]>(this.apiUrl).subscribe({
      next: (terms) => {
        this.keyTerms.set(terms);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  getTermById(id: string): KeyTerm | undefined {
    return this.keyTerms().find((term) => term.id === id);
  }

  searchTerms(query: string): KeyTerm[] {
    const lowerQuery = query.toLowerCase();
    return this.keyTerms().filter(
      (term) =>
        term.name.toLowerCase().includes(lowerQuery) ||
        term.definition.toLowerCase().includes(lowerQuery) ||
        term.category?.toLowerCase().includes(lowerQuery)
    );
  }
}
