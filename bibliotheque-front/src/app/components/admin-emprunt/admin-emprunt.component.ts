import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-emprunts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-emprunt.html',
  styleUrl: './admin-emprunt.css'
})
export class AdminEmpruntsComponent implements OnInit {

  emprunts: any[] = [];
  isLoading = true;
  statusFilter = 'Tous';
  searchTerm = '';
  sidebarCollapsed = false;
  showUserMenu = false;
  readerName = localStorage.getItem('reader_name') || 'Admin';

  currentPage = 1;
  pageSize = 10;
  sortBy = 'recent';

  // Modal de confirmation retour
  showReturnModal = false;
  pendingReturnId: number | null = null;

  // Modal nouvel emprunt
  showNewModal = false;
  creatingEmprunt = false;
  books: any[] = [];
  users: any[] = [];
  newEmpUserId: number | null = null;
  newEmpBookId: number | null = null;
  newEmpReturnDate = '';

  // Toast notification
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;
  private toastTimeout: any;

  statusLabels: Record<string, string> = {
    'ACTIF': 'Actif',
    'RETOURNE': 'Retourné'
  };

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
    this.loadEmprunts();
  }

  loadEmprunts(): void {
    this.isLoading = true;
    this.apiService.getEmprunts(0, 200).subscribe({
      next: (response) => {
        this.emprunts = response.content || response;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement emprunts:', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des emprunts.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  get totalCount(): number { return this.emprunts.length; }
  get actifsCount(): number { return this.emprunts.filter(e => e.statut === 'ACTIF').length; }
  get retournesCount(): number { return this.emprunts.filter(e => e.statut === 'RETOURNE').length; }
  get enRetardCount(): number { return this.emprunts.filter(e => this.isOverdue(e)).length; }

  get filteredEmprunts(): any[] {
    let list = this.emprunts;

    if (this.statusFilter === 'ACTIF') {
      list = list.filter(e => e.statut === 'ACTIF');
    } else if (this.statusFilter === 'RETOURNE') {
      list = list.filter(e => e.statut === 'RETOURNE');
    } else if (this.statusFilter === 'RETARD') {
      list = list.filter(e => this.isOverdue(e));
    }

    if (this.searchTerm.trim()) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(emp =>
        (emp.user?.nom || '').toLowerCase().includes(s) ||
        (emp.book?.titre || '').toLowerCase().includes(s) ||
        (emp.user?.email || '').toLowerCase().includes(s)
      );
    }

    if (this.sortBy === 'recent') {
      list = [...list].sort((a, b) => new Date(b.dateEmprunt).getTime() - new Date(a.dateEmprunt).getTime());
    } else if (this.sortBy === 'ancien') {
      list = [...list].sort((a, b) => new Date(a.dateEmprunt).getTime() - new Date(b.dateEmprunt).getTime());
    } else if (this.sortBy === 'retourPrevu') {
      list = [...list].sort((a, b) => new Date(a.dateRetourPrevue).getTime() - new Date(b.dateRetourPrevue).getTime());
    } else if (this.sortBy === 'titre') {
      list = [...list].sort((a, b) => (a.book?.titre || '').localeCompare(b.book?.titre || ''));
    }

    return list;
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredEmprunts.length / this.pageSize)); }

  get pagedEmprunts(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmprunts.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) pages.push(i);
    return pages;
  }

  setTab(tab: string): void {
    this.statusFilter = tab;
    this.currentPage = 1;
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  getInitial(): string { return this.readerName.charAt(0).toUpperCase(); }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (this.sidebarCollapsed) this.showUserMenu = false;
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  closeUserMenu(): void { this.showUserMenu = false; }

  navigateTo(route: string): void { this.router.navigate([route]); }
  goToProfile(): void { this.router.navigate(['/admin/profile']); }

  getStatusLabel(status: string): string { return this.statusLabels[status] || status; }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'ACTIF': 'badge-pending',
      'RETOURNE': 'badge-prete'
    };
    return map[status] || 'badge-annulee';
  }

  // ── Modal de confirmation retour ──────────────────
  openReturnModal(id: number): void {
    this.pendingReturnId = id;
    this.showReturnModal = true;
  }

  cancelReturn(): void {
    this.showReturnModal = false;
    this.pendingReturnId = null;
  }

  confirmReturn(): void {
    if (this.pendingReturnId === null) return;
    const id = this.pendingReturnId;
    this.showReturnModal = false;
    this.pendingReturnId = null;

    this.apiService.returnBook(id).subscribe({
      next: () => {
        this.showToast('Livre marqué comme retourné avec succès.', 'success');
        this.books = []; // force reload book list to get updated quantities
        this.loadEmprunts();
      },
      error: (err) => {
        console.error('Erreur retour livre:', err);
        this.showToast('Erreur lors du retour du livre.', 'error');
      }
    });
  }

  // ── Nouvel emprunt ────────────────────────────────
  get availableBooks(): any[] {
    return this.books.filter(b => (b.quantite ?? 0) > 0);
  }

  get studentUsers(): any[] {
    return this.users.filter(u => u.role === 'STUDENT' && u.active !== false);
  }

  openNewModal(): void {
    this.newEmpUserId = null;
    this.newEmpBookId = null;
    const defaultReturn = new Date();
    defaultReturn.setDate(defaultReturn.getDate() + 14);
    this.newEmpReturnDate = defaultReturn.toISOString().split('T')[0];
    this.showNewModal = true;

    if (this.books.length === 0) {
      this.apiService.getAllBooks().subscribe({
        next: (books) => { this.books = books; this.cdr.detectChanges(); },
        error: (err) => console.error('Erreur chargement livres:', err)
      });
    }
    if (this.users.length === 0) {
      this.apiService.getAllUsers().subscribe({
        next: (users) => { this.users = users; this.cdr.detectChanges(); },
        error: (err) => console.error('Erreur chargement utilisateurs:', err)
      });
    }
  }

  closeNewModal(): void { this.showNewModal = false; }

  createEmprunt(): void {
    if (!this.newEmpUserId || !this.newEmpBookId) {
      this.showToast('Veuillez sélectionner un étudiant et un livre.', 'error');
      return;
    }
    this.creatingEmprunt = true;
    this.apiService.createEmprunt(
      this.newEmpUserId,
      this.newEmpBookId,
      this.newEmpReturnDate || undefined
    ).subscribe({
      next: () => {
        this.creatingEmprunt = false;
        this.closeNewModal();
        this.showToast('Emprunt créé avec succès.', 'success');
        this.books = []; // force reload book list to get updated quantities
        this.loadEmprunts();
      },
      error: (err) => {
        this.creatingEmprunt = false;
        console.error('Erreur création emprunt:', err);
        this.showToast('Erreur lors de la création de l\'emprunt.', 'error');
      }
    });
  }

  // ── Toast ─────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.cdr.detectChanges();
    this.toastTimeout = setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 3500);
  }

  // ── Helpers date ──────────────────────────────────
  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  isOverdue(emprunt: any): boolean {
    if (emprunt.statut !== 'ACTIF') return false;
    return new Date() > new Date(emprunt.dateRetourPrevue);
  }

  getDaysOverdue(emprunt: any): number {
    if (!this.isOverdue(emprunt)) return 0;
    const diff = new Date().getTime() - new Date(emprunt.dateRetourPrevue).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  getUserInitials(nom: string): string {
    if (!nom) return '?';
    const parts = nom.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nom.substring(0, 2).toUpperCase();
  }

  getUserColor(nom: string): string {
    const colors = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#22c55e','#14b8a6','#ef4444','#f59e0b'];
    let hash = 0;
    for (let i = 0; i < (nom || '').length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  supprimerEmprunt(id: number): void {
    if (!confirm('Supprimer définitivement cet emprunt ?')) return;
    this.apiService.deleteEmprunt(id).subscribe({
      next: () => {
        this.showToast('Emprunt supprimé avec succès.', 'success');
        this.loadEmprunts();
      },
      error: (err) => {
        console.error('Erreur suppression emprunt:', err);
        this.showToast('Erreur lors de la suppression.', 'error');
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}