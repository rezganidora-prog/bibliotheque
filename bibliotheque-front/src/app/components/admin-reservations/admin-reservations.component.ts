import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reservations.html',
  styleUrl: './admin-reservations.css'
})
export class AdminReservationsComponent implements OnInit {

  // Data
  reservations: any[] = [];
  isLoading = true;
  searchTerm = '';
  activeTab = 'Toutes';
  selectedReservation: any = null;

  // UI state
  showRejectModal = false;
  showFilterModal = false;
  showNotifModal = false;
  showNewModal = false;
  openActionMenuId: number | null = null;
  creatingReservation = false;
  currentReservation: any = null;
  rejectReason = '';
  notifTitle = '';
  notifContent = '';
  notifType = 'MESSAGE';
  sidebarCollapsed = false;
  showUserMenu = false;
  readerName = 'Admin';
  sortBy = 'recent';

  // Filter modal fields
  filterStatus: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  // New reservation modal fields
  books: any[] = [];
  users: any[] = [];
  newResUserId: number | null = null;
  newResBookId: number | null = null;
  newResNotes = '';
  newResPreferredDate = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  tabs = ['Toutes', 'En attente', 'Prêtes', 'Récupérées', 'Annulées'];

  statusLabels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    APPROUVE:   'Prête',
    REFUSE:     'Refusée',
    ANNULE:     'Annulée',
    RECUPERE:   'Récupérée'
  };

  statusColors: Record<string, string> = {
    EN_ATTENTE: '#f97316',
    APPROUVE:   '#22c55e',
    REFUSE:     '#ef4444',
    ANNULE:     '#6b7280',
    RECUPERE:   '#3b82f6'
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
    this.readerName = this.auth.getReaderName() || 'Admin';
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading = true;
    this.apiService.getReservations(0, 200).subscribe({
      next: (response) => {
        this.reservations = response.content || response;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement reservations:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ----- Statistics -----
  get totalCount(): number { return this.reservations.length; }
  get enAttenteCount(): number { return this.reservations.filter(r => r.status === 'EN_ATTENTE').length; }
  get pretesCount(): number { return this.reservations.filter(r => r.status === 'APPROUVE').length; }
  get recupereesCount(): number { return this.reservations.filter(r => r.status === 'RECUPERE').length; }
  get annuleesCount(): number { return this.reservations.filter(r => r.status === 'REFUSE' || r.status === 'ANNULE').length; }

  // ----- Filtering & sorting -----
  get baseFiltered(): any[] {
    let list = this.reservations;

    // Tab filter
    if (this.activeTab === 'En attente') list = list.filter(r => r.status === 'EN_ATTENTE');
    else if (this.activeTab === 'Prêtes') list = list.filter(r => r.status === 'APPROUVE');
    else if (this.activeTab === 'Récupérées') list = list.filter(r => r.status === 'RECUPERE');
    else if (this.activeTab === 'Annulées') list = list.filter(r => r.status === 'REFUSE' || r.status === 'ANNULE');

    // Filter modal
    if (this.filterStatus) list = list.filter(r => r.status === this.filterStatus);
    if (this.filterStartDate) {
      const start = new Date(this.filterStartDate);
      list = list.filter(r => new Date(r.reservationDate) >= start);
    }
    if (this.filterEndDate) {
      const end = new Date(this.filterEndDate);
      list = list.filter(r => new Date(r.reservationDate) <= end);
    }

    // Search
    if (this.searchTerm.trim()) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(r =>
        (r.user?.nom || '').toLowerCase().includes(s) ||
        (r.book?.titre || '').toLowerCase().includes(s) ||
        (r.user?.email || '').toLowerCase().includes(s)
      );
    }

    // Sorting
    if (this.sortBy === 'recent') list = [...list].sort((a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime());
    else if (this.sortBy === 'ancien') list = [...list].sort((a, b) => new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime());
    else if (this.sortBy === 'titre') list = [...list].sort((a, b) => (a.book?.titre || '').localeCompare(b.book?.titre || ''));
    else if (this.sortBy === 'user') list = [...list].sort((a, b) => (a.user?.nom || '').localeCompare(b.user?.nom || ''));

    return list;
  }

  // ----- Pagination -----
  get totalPages(): number { return Math.max(1, Math.ceil(this.baseFiltered.length / this.pageSize)); }

  get pagedReservations(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.baseFiltered.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) pages.push(i);
    return pages;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.selectedReservation = null;
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  selectReservation(res: any): void {
    this.selectedReservation = this.selectedReservation?.id === res.id ? null : res;
  }

  closeDetail(): void { this.selectedReservation = null; }

  // ----- UI helpers -----
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
  closeMenus(): void {
    this.showUserMenu = false;
    this.openActionMenuId = null;
  }

  toggleActionMenu(event: Event, res: any): void {
    event.stopPropagation();
    this.openActionMenuId = this.openActionMenuId === res.id ? null : res.id;
  }

  closeActionMenu(): void { this.openActionMenuId = null; }

  navigateTo(route: string): void { this.router.navigate([route]); }
  goToProfile(): void { this.router.navigate(['/admin/profile']); }

  getStatusLabel(status: string): string { return this.statusLabels[status] || status; }
  getStatusColor(status: string): string { return this.statusColors[status] || '#6b7280'; }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'badge-pending',
      APPROUVE:   'badge-prete',
      RECUPERE:   'badge-recuperee',
      REFUSE:     'badge-annulee',
      ANNULE:     'badge-annulee'
    };
    return map[status] || 'badge-annulee';
  }

  getAvailabilityClass(res: any): string {
    if (res.status === 'APPROUVE') return 'avail-prete';
    if (res.status === 'RECUPERE') return 'avail-recuperee';
    if (res.status === 'REFUSE' || res.status === 'ANNULE') return 'avail-annulee';
    return '';
  }

  getAvailabilityText(res: any): string {
    if (res.status === 'APPROUVE') return 'Disponible';
    if (res.status === 'RECUPERE') return 'Récupérée';
    if (res.status === 'REFUSE' || res.status === 'ANNULE') return 'Annulée';
    return '-';
  }

  // ----- Overdue detection -----
  isLate(res: any): boolean {
    if (res.status !== 'EN_ATTENTE') return false;
    if (!res.expiryDate) return false;
    return new Date() > new Date(res.expiryDate);
  }

  // ----- Date formatters -----
  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatDateShort(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getResId(res: any, idx: number): string {
    return '#RES-' + String(res.id || (this.totalCount - idx)).padStart(3, '0');
  }

  getUserInitials(nom: string): string {
    if (!nom) return '?';
    const parts = nom.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nom.substring(0, 2).toUpperCase();
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

  getUserColor(nom: string): string {
    const colors = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#22c55e','#14b8a6','#ef4444','#f59e0b'];
    let hash = 0;
    for (let i = 0; i < (nom || '').length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  // ----- Reservation actions -----
  approveReservation(id: number): void {
    this.apiService.approveReservation(id).subscribe({
      next: () => { this.loadReservations(); this.closeDetail(); },
      error: (err) => console.error('Erreur approbation:', err)
    });
  }

  markAsRecuperated(id: number): void {
    this.apiService.recuperateReservation(id).subscribe({
      next: () => { this.loadReservations(); this.closeDetail(); },
      error: (err) => {
        console.error('Erreur récupération reservation:', err);
      }
    });
  }

  prolongReservation(id: number): void {
    console.log('Prolongation de la réservation:', id);
  }

  printTicket(res: any): void {
    const content = `
       TICKET DE RÉSERVATION
       =====================
       Réservation : ${this.getResId(res, 0)}
       Livre       : ${res.book?.titre || '-'}
       Auteur      : ${res.book?.auteur || '-'}
       Utilisateur : ${res.user?.nom || '-'}
       Email       : ${res.user?.email || '-'}
       Statut      : ${this.getStatusLabel(res.status)}
       Date        : ${this.formatDateTime(res.reservationDate)}
     `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write('<pre style="font-family:monospace;padding:20px;">' + content + '</pre>');
      win.document.close();
      win.print();
    }
  }

  // ----- Reject modal -----
  openRejectModal(reservation: any): void {
    this.currentReservation = reservation;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.currentReservation = null;
    this.rejectReason = '';
  }

  rejectReservation(): void {
    if (!this.rejectReason.trim()) return;
    this.apiService.rejectReservation(this.currentReservation.id, this.rejectReason).subscribe({
      next: () => { this.loadReservations(); this.closeRejectModal(); this.closeDetail(); },
      error: (err) => console.error('Erreur refus:', err)
    });
  }

  // ----- Notification actions -----
  openNotifModal(reservation: any): void {
    this.currentReservation = reservation;
    this.notifTitle = 'Message de l\'administration - L\'Arche des Livres';
    this.notifContent = '';
    this.notifType = 'MESSAGE';
    this.showNotifModal = true;
  }

  closeNotifModal(): void {
    this.showNotifModal = false;
    this.notifTitle = '';
    this.notifContent = '';
  }

  sendCustomNotification(): void {
    if (!this.notifTitle.trim() || !this.notifContent.trim()) {
      alert('Veuillez remplir le titre et le contenu du message.');
      return;
    }
    const userId = this.currentReservation?.user?.id;
    if (!userId) {
      alert('Impossible d\'identifier l\'étudiant destinataire.');
      return;
    }
    const payload = {
      title: this.notifTitle,
      content: this.notifContent,
      type: this.notifType
    };
    this.apiService.sendNotification(userId, payload).subscribe({
      next: () => {
        alert('Message / Notification envoyé(e) avec succès !');
        this.closeNotifModal();
      },
      error: (err) => {
        console.error('Erreur envoi notification:', err);
        alert('Erreur lors de l\'envoi du message.');
      }
    });
  }

  // ----- Filter modal -----
  openFilterModal(): void { this.showFilterModal = true; }
  closeFilterModal(): void { this.showFilterModal = false; }
  applyFilters(): void { this.currentPage = 1; this.showFilterModal = false; }

  // ----- New reservation modal -----
  openNewModal(): void {
    this.newResUserId = null;
    this.newResBookId = null;
    this.newResNotes = '';
    this.newResPreferredDate = '';
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

  createNewReservation(): void {
    if (!this.newResUserId || !this.newResBookId) {
      alert('Veuillez sélectionner un utilisateur et un livre.');
      return;
    }
    this.creatingReservation = true;
    this.apiService.createReservation(
      this.newResUserId,
      this.newResBookId,
      this.newResNotes || undefined,
      this.newResPreferredDate || undefined
    ).subscribe({
      next: () => {
        this.creatingReservation = false;
        this.closeNewModal();
        this.loadReservations();
      },
      error: (err) => {
        this.creatingReservation = false;
        console.error('Erreur création réservation:', err);
        alert('Erreur lors de la création de la réservation.');
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
