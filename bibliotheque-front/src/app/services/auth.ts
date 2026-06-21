import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8082/auth';

  constructor(private http: HttpClient) {}

  // 🔐 Inscription (Sign Up)
  register(data: { nom: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  // 🔑 Connexion (Login) et sauvegarde du token JWT
  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  // Vérifier si connecté
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Déconnexion
  logout(): void {
    localStorage.removeItem('token');
  }
}
