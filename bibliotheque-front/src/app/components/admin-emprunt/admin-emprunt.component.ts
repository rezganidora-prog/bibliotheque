import { Component, OnInit, HostListener } from '@angular/core';
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

  // Toast notification
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;
  private toastTimeout: any;

  statusLabels: Record<string, string> = {
    'ACTIF': 'Actif',
    'RETOURNE': 'Retourné',
    'PERDU': 'Perdu'
  };

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
    this.loadEmprunts();
  }

  loadEmprunts(): void {
    this.isLoading = true;
    this.apiService.getEmprunts(0, 200).subscribe({
      next: (response) => {
        this.emprunts = response.content || response;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement emprunts:', err);
        this.isLoading = false;
        this.showToast('Erreur lors du chargement des emprunts.', 'error');
      }
    });
  }

  get totalCount(): number { return this.emprunts.length; }
  get actifsCount(): number { return this.emprunts.filter(e => e.statut === 'ACTIF').length; }
  get retournesCount(): number { return this.emprunts.filter(e => e.statut === 'RETOURNE').length; }
  get perdusCount(): number { return this.emprunts.filter(e => e.statut === 'PERDU').length; }
  get enRetardCount(): number { return this.emprunts.filter(e => e.estEnRetard === true && e.statut === 'ACTIF').length; }

  get filteredEmprunts(): any[] {
    let list = this.emprunts;

    if (this.statusFilter === 'ACTIF') {
      list = list.filter(e => e.statut === 'ACTIF');
    } else if (this.statusFilter === 'RETOURNE') {
      list = list.filter(e => e.statut === 'RETOURNE');
    } else if (this.statusFilter === 'PERDU') {
      list = list.filter(e => e.statut === 'PERDU');
    } else if (this.statusFilter === 'RETARD') {
      list = list.filter(e => e.estEnRetard === true && e.statut === 'ACTIF');
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
      'RETOURNE': 'badge-prete',
      'PERDU': 'badge-annulee'
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
        this.loadEmprunts();
      },
      error: (err) => {
        console.error('Erreur retour livre:', err);
        this.showToast('Erreur lors du retour du livre.', 'error');
      }
    });
  }

  // ── Toast ─────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimeout = setTimeout(() => { this.toastVisible = false; }, 3500);
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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}