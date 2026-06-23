import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-livres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-livres.html',
  styleUrl: './admin-livres.css'
})
export class AdminLivresComponent implements OnInit {

  books: any[] = [];
  isLoading = true;
  showModal = false;
  isEditMode = false;
  currentBook: any = {
    titre: '',
    auteur: '',
    isbn: '',
    quantite: 1,
    category: 'Général',
    disponible: true
  };
  searchTerm = '';
  categoryFilter = 'Tous';

  categories = ['Tous', 'Littérature', 'Science-fiction', 'Histoire', 'Développement', 'Jeunesse', 'Autres'];

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBooks();
  }

  loadBooks(): void {
    this.isLoading = true;
    this.apiService.getAllBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement livres:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredBooks(): any[] {
    return this.books.filter(book => {
      const matchCategory = this.categoryFilter === 'Tous' || book.category === this.categoryFilter;
      const matchSearch = book.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                         book.auteur.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentBook = {
      titre: '',
      auteur: '',
      isbn: '',
      quantite: 1,
      category: 'Général',
      disponible: true
    };
    this.showModal = true;
  }

  openEditModal(book: any): void {
    this.isEditMode = true;
    this.currentBook = { ...book };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveBook(): void {
    if (!this.currentBook.titre || !this.currentBook.auteur || !this.currentBook.isbn) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (this.isEditMode) {
      // Mettre à jour
      this.apiService.updateBook(this.currentBook.id, this.currentBook).subscribe({
        next: () => {
          alert('Livre mis à jour avec succès !');
          this.loadBooks();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur mise à jour livre:', err);
          alert('Erreur lors de la mise à jour du livre.');
        }
      });
    } else {
      // Ajouter
      this.apiService.addBook(this.currentBook).subscribe({
        next: () => {
          alert('Livre ajouté avec succès !');
          this.loadBooks();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur ajout livre:', err);
          alert('Erreur lors de l\'ajout du livre.');
        }
      });
    }
  }

  deleteBook(id: number, titre: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${titre}" ?`)) {
      this.apiService.deleteBook(id).subscribe({
        next: () => {
          alert('Livre supprimé avec succès !');
          this.loadBooks();
        },
        error: (err) => {
          console.error('Erreur suppression livre:', err);
          alert('Erreur lors de la suppression du livre.');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}