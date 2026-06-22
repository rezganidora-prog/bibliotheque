import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // STATS
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/stats`, { headers: this.getHeaders() });
  }

  // BOOKS
  getAllBooks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/books`);
  }

  getBooksPaginated(page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/books/paginated?page=${page}&size=${size}`);
  }

  // RESERVATIONS
  getReservations(page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/reservations?page=${page}&size=${size}`, { headers: this.getHeaders() });
  }

  approveReservation(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/reservations/${id}/approve`, {}, { headers: this.getHeaders() });
  }

  rejectReservation(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/reservations/${id}/reject`, { reason }, { headers: this.getHeaders() });
  }

  // EMPRUNTS
  getEmprunts(page: number, size: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/emprunts?page=${page}&size=${size}`, { headers: this.getHeaders() });
  }

  getUserEmprunts(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/emprunts/user/${userId}`, { headers: this.getHeaders() });
  }

  returnBook(empruntId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/emprunts/${empruntId}/return`, {}, { headers: this.getHeaders() });
  }

  getOverdueEmprunts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/emprunts/overdue`, { headers: this.getHeaders() });
  }

  // STUDENTS
  getAllStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/students`, { headers: this.getHeaders() });
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/students/${id}`, { headers: this.getHeaders() });
  }

  // AUTH
  updateProfile(nom: string, password: string, confirmPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/update-profile`, 
      { nom, password, confirmPassword }, 
      { headers: this.getHeaders() }
    );
  }
}