import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { BookService, Book } from '../../services/book';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
// Dashboard d'administration pour la gestion de l'Arche
export class AdminDashboardComponent implements OnInit {
  booksCatalog: Book[] = [];
  isLoading = false;

  // Stat values
  totalBooks = 0;
  activeReservations = 0;
  booksLoaned = 15;
  returnsDueToday = 3;

  recentReservations = [
    { student: 'Alice Dupont', book: 'Les Misérables', date: '2026-06-10', status: 'En attente' },
    { student: 'Bob Martin', book: 'Le Petit Prince', date: '2026-06-09', status: 'Approuvé' },
    { student: 'Claire Lévy', book: '1984', date: '2026-06-08', status: 'Refusé' }
  ];

  // Modal controls
  showBookModal = false;
  isEditMode = false;
  currentBook: Book = {
    titre: '',
    auteur: '',
    isbn: '',
    quantite: 1
  };

  constructor(
    private auth: Auth,
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBooks();
  }

  loadBooks() {
    this.isLoading = true;
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.booksCatalog = books || [];
        this.updateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des livres du serveur', err);
        // Fallback mock data in case backend is empty or unavailable
        this.booksCatalog = [
          { id: 1, titre: 'Les Misérables', auteur: 'Victor Hugo', isbn: '978-2070409228', quantite: 5, disponible: true },
          { id: 2, titre: 'Le Petit Prince', auteur: 'Antoine de Saint-Exupéry', isbn: '978-2070408504', quantite: 2, disponible: true },
          { id: 3, titre: '1984', auteur: 'George Orwell', isbn: '978-2070368228', quantite: 1, disponible: false }
        ];
        this.updateStats();
        this.isLoading = false;
      }
    });
  }

  updateStats() {
    // total distinct books or total physical copies
    this.totalBooks = this.booksCatalog.reduce((sum, b) => sum + (b.quantite || 0), 0);
    // count pending reservations
    this.activeReservations = this.recentReservations.filter(r => r.status === 'En attente').length;
  }

  getReaderName(): string {
    return localStorage.getItem('reader_name') || 'Admin';
  }

  logout(): void {
    this.auth.logout();
    localStorage.removeItem('reader_name');
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.router.navigate(['/admin/profile']);
  }

  // Modals actions
  addBook() {
    this.isEditMode = false;
    this.currentBook = {
      titre: '',
      auteur: '',
      isbn: '',
      quantite: 1
    };
    this.showBookModal = true;
  }

  editBook(book: Book) {
    this.isEditMode = true;
    this.currentBook = { ...book };
    this.showBookModal = true;
  }

  closeModal() {
    this.showBookModal = false;
  }

  saveBook() {
    if (!this.currentBook.titre || !this.currentBook.auteur || !this.currentBook.isbn) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (this.isEditMode && this.currentBook.id) {
      this.bookService.updateBook(this.currentBook.id, this.currentBook).subscribe({
        next: () => {
          this.closeModal();
          this.loadBooks();
        },
        error: (err) => {
          console.error('Erreur modification', err);
          alert('Impossible de modifier le livre. Vérifiez l\'ISBN unique.');
        }
      });
    } else {
      this.bookService.addBook(this.currentBook).subscribe({
        next: () => {
          this.closeModal();
          this.loadBooks();
        },
        error: (err) => {
          console.error('Erreur ajout', err);
          alert('Impossible d\'ajouter le livre. Vérifiez l\'ISBN unique.');
        }
      });
    }
  }

  deleteBook(book: Book) {
    if (!book.id) return;
    if (confirm(`Êtes-vous sûr de vouloir supprimer le livre "${book.titre}" ?`)) {
      this.bookService.deleteBook(book.id).subscribe({
        next: () => {
          this.loadBooks();
        },
        error: (err) => {
          console.error('Erreur suppression', err);
          alert('Impossible de supprimer le livre.');
        }
      });
    }
  }

  // Reservations approval
  approveReservation(idx: number) {
    this.recentReservations[idx].status = 'Approuvé';
    this.booksLoaned += 1;
    this.updateStats();
  }

  rejectReservation(idx: number) {
    this.recentReservations[idx].status = 'Refusé';
    this.updateStats();
  }

  validateReservations() {
    let count = 0;
    this.recentReservations.forEach(r => {
      if (r.status === 'En attente') {
        r.status = 'Approuvé';
        this.booksLoaned += 1;
        count++;
      }
    });
    if (count > 0) {
      alert(`${count} réservation(s) validée(s) avec succès.`);
    } else {
      alert('Aucune réservation en attente.');
    }
    this.updateStats();
  }

  markAsReturned() {
    const input = prompt("Entrez l'ISBN ou le titre du livre retourné :");
    if (!input || !input.trim()) return;

    const query = input.trim().toLowerCase();
    const book = this.booksCatalog.find(b =>
      b.isbn.toLowerCase() === query ||
      b.titre.toLowerCase().includes(query)
    );

    if (book && book.id) {
      book.quantite = (book.quantite || 0) + 1;
      this.bookService.updateBook(book.id, book).subscribe({
        next: () => {
          if (this.booksLoaned > 0) {
            this.booksLoaned -= 1;
          }
          this.loadBooks();
          alert(`Le livre "${book.titre}" a été retourné. Inventaire mis à jour (+1) !`);
        },
        error: (err) => {
          console.error('Erreur retour', err);
          alert(`Erreur lors du retour du livre "${book.titre}".`);
        }
      });
    } else {
      alert("Livre non trouvé dans le catalogue. Veuillez vérifier l'ISBN ou le titre.");
    }
  }
}
