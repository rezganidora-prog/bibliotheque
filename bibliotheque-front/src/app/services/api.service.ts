import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private auth: Auth) { }

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
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

  addBook(book: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/books`, book, { headers: this.getHeaders() });
  }

  updateBook(id: number, book: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/books/${id}`, book, { headers: this.getHeaders() });
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/books/${id}`, { headers: this.getHeaders() });
  }

  uploadBookCover(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    const token = this.auth.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token || ''}` });
    return this.http.post(`${this.apiUrl}/api/books/${id}/cover`, formData, { headers });
  }

  deleteBookCover(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/books/${id}/cover`, { headers: this.getHeaders() });
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

  recuperateReservation(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/reservations/${id}/recuperate`, {}, { headers: this.getHeaders() });
  }

  createReservation(userId: number, bookId: number, notes?: string, preferredDate?: string): Observable<any> {
    let url = `${this.apiUrl}/api/reservations?userId=${userId}&bookId=${bookId}`;
    if (notes) url += `&notes=${encodeURIComponent(notes)}`;
    if (preferredDate) url += `&preferredDate=${encodeURIComponent(preferredDate)}`;
    return this.http.post(url, {}, { headers: this.getHeaders() });
  }

  cancelReservation(reservationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/reservations/${reservationId}`, { headers: this.getHeaders() });
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

  createEmprunt(userId: number, bookId: number, dateRetourPrevue?: string): Observable<any> {
    const body: { book: { id: number }; user: { id: number }; dateRetourPrevue?: string } = {
      book: { id: bookId },
      user: { id: userId }
    };
    if (dateRetourPrevue) body.dateRetourPrevue = dateRetourPrevue;
    return this.http.post(`${this.apiUrl}/api/emprunts`, body, { headers: this.getHeaders() });
  }

  // USERS
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/users`, { headers: this.getHeaders() });
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/users`, user, { headers: this.getHeaders() });
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/users/${id}`, user, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/users/${id}`, { headers: this.getHeaders() });
  }

  // STUDENTS
  getAllStudents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/students`, { headers: this.getHeaders() });
  }

  getStudentById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/students/${id}`, { headers: this.getHeaders() });
  }

  updateStudentProfile(userId: number, data: { nom?: string; email?: string; password?: string; universite?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/students/${userId}`, data, { headers: this.getHeaders() });
  }

  // FAVORIS
  getUserFavoris(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/favoris/user/${userId}`, { headers: this.getHeaders() });
  }

  checkFavori(userId: number, bookId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/favoris/check?userId=${userId}&bookId=${bookId}`, { headers: this.getHeaders() });
  }

  addFavori(userId: number, bookId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/favoris?userId=${userId}&bookId=${bookId}`, {}, { headers: this.getHeaders() });
  }

  removeFavori(userId: number, bookId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/favoris?userId=${userId}&bookId=${bookId}`, { headers: this.getHeaders() });
  }

  // NOTIFICATIONS
  sendNotification(userId: number, notification: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/notifications/send/${userId}`, notification, { headers: this.getHeaders() });
  }

  getUserNotifications(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/notifications/user/${userId}`, { headers: this.getHeaders() });
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/notifications/${id}`, { headers: this.getHeaders() });
  }

  getUserReservations(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/reservations/user/${userId}`, { headers: this.getHeaders() });
  }
}