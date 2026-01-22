import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, AuthCredentials, AuthResponse } from '../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';

  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Token management
  private readonly TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticated.set(true);
      // Optionally validate token on init (call a /validate endpoint)
    }
  }

  login(credentials: AuthCredentials): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          this.setToken(response.token);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          this.isLoading.set(false);
        })
      );
  }

  logout(): void {
    this.clearToken();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.error.set(null);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  get isDungeonMaster(): boolean {
    return this.currentUser()?.role === 'DungeonMaster';
  }

  get isUser(): boolean {
    return this.currentUser()?.role === 'User';
  }
}
