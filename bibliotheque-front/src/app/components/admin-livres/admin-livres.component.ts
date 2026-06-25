import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
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
  searchTerm = '';
  categoryFilter = 'Tous';

  // Sidebar state
  sidebarCollapsed = false;
  showUserMenu = false;
  readerName = localStorage.getItem('reader_name') || 'Admin';

  // Modal CRUD state
  showBookModal = false;
  isEditMode = false;
  currentBook: any = {
    titre: '',
    auteur: '',
    isbn: '',
    quantite: 1,
    category: 'Roman',
    langue: 'Français',
    editeur: '',
    anneePublication: 2026,
    status: 'Disponible'
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;

  categories = ['Tous', 'Roman', 'Science-fiction', 'Classique', 'Fantasy', 'Développement personnel', 'Autres'];
  
  formCategories = ['Roman', 'Science-fiction', 'Classique', 'Fantasy', 'Développement personnel', 'Autres'];
  formStatuses = ['Disponible', 'Emprunté', 'Indisponible'];

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement livres:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ----- Status from backend -----
  getBookStatus(book: any): string {
    if (book.status) return book.status;
    if (!book.disponible) return (book.quantite && book.quantite > 0) ? 'Emprunté' : 'Indisponible';
    return 'Disponible';
  }

  // ----- Dynamic Statistics -----
  get totalBooksQty(): number {
    return this.books.reduce((acc, b) => acc + (b.quantite || 0), 0);
  }

  get disponiblesQty(): number {
    return this.books
      .filter(b => this.getBookStatus(b) === 'Disponible')
      .reduce((acc, b) => acc + (b.quantite || 0), 0);
  }

  get empruntesQty(): number {
    return this.books
      .filter(b => this.getBookStatus(b) === 'Emprunté')
      .reduce((acc, b) => acc + (b.quantite || 0), 0);
  }

  get indisponiblesQty(): number {
    return this.books
      .filter(b => this.getBookStatus(b) === 'Indisponible')
      .reduce((acc, b) => acc + (b.quantite || 0), 0);
  }

  // ----- Filtering -----
  get baseFilteredBooks(): any[] {
    let list = this.books;

    if (this.categoryFilter !== 'Tous') {
      list = list.filter(b => (b.category || '').toLowerCase() === this.categoryFilter.toLowerCase());
    }

    if (this.searchTerm.trim()) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(b =>
        (b.titre || '').toLowerCase().includes(s) ||
        (b.auteur || '').toLowerCase().includes(s) ||
        (b.isbn || '').toLowerCase().includes(s)
      );
    }

    return list;
  }

  // ----- Pagination -----
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.baseFilteredBooks.length / this.pageSize));
  }

  get pagedBooks(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.baseFilteredBooks.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  // ----- CRUD Actions -----
  openAddModal(): void {
    this.isEditMode = false;
    this.currentBook = {
      titre: '',
      auteur: '',
      isbn: '',
      quantite: 1,
      category: 'Roman',
      langue: 'Français',
      editeur: '',
      anneePublication: 2026,
      status: 'Disponible'
    };
    this.showBookModal = true;
  }

  openEditModal(book: any): void {
    this.isEditMode = true;
    this.currentBook = { 
      ...book, 
      status: book.disponible ? 'Disponible' : (book.quantite && book.quantite > 0 ? 'Emprunté' : 'Indisponible'),
      category: book.category || 'Roman',
      langue: book.langue || 'Français',
      editeur: book.editeur || '',
      anneePublication: book.anneePublication || 2026
    };
    this.showBookModal = true;
  }

  closeModal(): void {
    this.showBookModal = false;
  }

  saveBook(): void {
    if (!this.currentBook.titre || !this.currentBook.auteur || !this.currentBook.isbn) {
      alert('Veuillez remplir tous les champs obligatoires (Titre, Auteur, ISBN).');
      return;
    }

    // Set disponible boolean based on quantity/status
    this.currentBook.disponible = (this.currentBook.quantite > 0 && this.currentBook.status !== 'Indisponible');

    if (this.isEditMode) {
      this.apiService.updateBook(this.currentBook.id, this.currentBook).subscribe({
        next: () => {
          this.loadBooks();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur mise à jour livre:', err);
          alert('Erreur lors de la mise à jour du livre.');
        }
      });
    } else {
      this.apiService.addBook(this.currentBook).subscribe({
        next: () => {
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le livre "${titre}" ?`)) {
      this.apiService.deleteBook(id).subscribe({
        next: () => {
          this.loadBooks();
        },
        error: (err) => {
          console.error('Erreur suppression livre:', err);
          alert('Erreur lors de la suppression du livre.');
        }
      });
    }
  }

  // ----- UI helpers -----
  getInitial(): string {
    return this.readerName.charAt(0).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (this.sidebarCollapsed) this.showUserMenu = false;
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  goToProfile(): void {
    this.router.navigate(['/admin/profile']);
  }

  getBookThumbStyle(title: string): string {
    const map: Record<string, string> = {
      '1984': '#6c1d1d',
      'étranger': '#2b3a4a',
      'petit prince': '#1e3c72',
      'sapiens': '#14532d',
      'misérables': '#653b1b',
      'seigneur': '#1f2937',
      'harry potter': '#5b21b6',
      'alchimiste': '#db2777',
      'rouge': '#991b1b'
    };
    const lower = title.toLowerCase();
    for (const key in map) {
      if (lower.includes(key)) {
        return `background:${map[key]};color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border-radius:4px;width:32px;height:42px;box-shadow:0 1px 3px rgba(0,0,0,0.15);`;
      }
    }
    return `background:#6b4c1b;color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border-radius:4px;width:32px;height:42px;box-shadow:0 1px 3px rgba(0,0,0,0.15);`;
  }

  getCategoryBadgeClass(category: string): string {
    const map: Record<string, string> = {
      'roman': 'badge-roman',
      'science-fiction': 'badge-sf',
      'classique': 'badge-classique',
      'fantasy': 'badge-fantasy',
      'développement personnel': 'badge-dev',
      'histoire': 'badge-histoire'
    };
    return map[(category || '').toLowerCase()] || 'badge-autres';
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'disponible': 'badge-dispo',
      'emprunté': 'badge-emprunte',
      'indisponible': 'badge-indispo'
    };
    return map[(status || '').toLowerCase()] || 'badge-indispo';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}