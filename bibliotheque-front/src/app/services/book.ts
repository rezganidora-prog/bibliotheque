import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Auth } from './auth';

export interface Book {
  id?: number;
  titre: string;
  auteur: string;
  isbn: string;
  quantite: number;
  disponible?: boolean;
  cover?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = `${environment.apiUrl}/api/books`;

  constructor(private http: HttpClient, private auth: Auth) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // GET: Récupérer tous les livres
  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // GET: Récupérer un livre par ID
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // POST: Ajouter un livre (Admin uniquement)
  addBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book, { headers: this.getHeaders() });
  }

  // PUT: Mettre à jour un livre (Admin uniquement)
  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book, { headers: this.getHeaders() });
  }

  // DELETE: Supprimer un livre (Admin uniquement)
  deleteBook(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
