import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private apiUrl = 'http://localhost:8082'; // URL de base de votre backend

  constructor(private http: HttpClient) {}

  // Méthodes pour AdminDashboardComponent
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/stats`);
  }

  getAllBooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/books`);
  }

  getOverdueEmprunts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/emprunts/overdue`);
  }

  // Méthodes pour StudentProfileComponent
  getUserEmprunts(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/emprunts/user/${userId}`);
  }

  // Cette méthode est une hypothèse basée sur l'appel dans StudentProfileComponent
  // Le backend StudentController a updateStudent(Long id, User user)
  // Il faudra peut-être ajuster le DTO envoyé
  updateProfile(userId: number, name: string, password?: string): Observable<any> {
    const body: any = { nom: name };
    if (password) {
      body.password = password;
    }
    // Assumons que l'endpoint est /api/students/{userId} pour la mise à jour du profil étudiant
    return this.http.put<any>(`${this.apiUrl}/api/students/${userId}`, body);
  }
}
