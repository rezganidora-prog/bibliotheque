import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(data: { nom: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response && response.token) {
          sessionStorage.setItem('token', response.token);
        }
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('reader_name');
    localStorage.removeItem('token');
    localStorage.removeItem('reader_name');
  }

  private getDecodedPayload(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodeURIComponent(escape(decodedJson)));
    } catch {
      try {
        const token = this.getToken();
        return token ? JSON.parse(atob(token.split('.')[1])) : null;
      } catch {
        return null;
      }
    }
  }

  getRole(): string {
    const payload = this.getDecodedPayload();
    return payload ? (payload.role || '') : '';
  }

  getUserId(): number {
    const payload = this.getDecodedPayload();
    if (!payload) return 0;
    return payload.userId || payload.id || 0;
  }

  getEmail(): string {
    const payload = this.getDecodedPayload();
    return payload ? (payload.sub || '') : '';
  }

  getReaderName(): string {
    return sessionStorage.getItem('reader_name') || localStorage.getItem('reader_name') || 'Utilisateur';
  }

  setReaderName(name: string): void {
    sessionStorage.setItem('reader_name', name);
    localStorage.setItem('reader_name', name);
  }

  removeReaderName(): void {
    sessionStorage.removeItem('reader_name');
  }
}
