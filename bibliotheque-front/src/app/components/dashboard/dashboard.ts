import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { BookService, Book } from '../../services/book';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  books: Book[] = [];
  isLoading = true;
  errorMessage = '';
  sidebarCollapsed = false;
  showUserMenu = false;

  userId = 0;
  activeSection = 'home';
  userReservations: any[] = [];
  userEmprunts: any[] = [];
  notifications: any[] = [];
  unreadNotificationsCount = 0;
  showNotificationsDropdown = false;

  // Toast state
  toast: { visible: boolean; message: string; type: 'success' | 'error' } =
    { visible: false, message: '', type: 'success' };

  // Loading flags per action
  reservingBookId: number | null = null;
  cancellingResId: number | null = null;

  // ── Reservation Modal ──────────────────────────────────────────────────
  showReservationModal = false;
  modalBook: any = null;
  modalPreferredDate = '';
  modalNotes = '';
  modalUrgency = 'NORMAL'; // URGENT | NORMAL | FLEXIBLE
  isSubmittingReservation = false;

  // ── Book Detail Modal ──────────────────────────────────────────────────
  showBookDetailModal = false;
  selectedBookDetail: any = null;

  // Today's date as min for date picker
  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Max date = today + 30 days
  get maxDateStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }

  // Favoris
  favoriBookIds: Set<number> = new Set();

  // Search/sort
  searchTerm = '';
  selectedCategory = 'Toutes catégories';
  selectedSort = 'Trier par';

  constructor(
    private auth: Auth,
    private bookService: BookService,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.extractUserIdFromToken();
    this.loadBooks();
    if (this.userId > 0) {
      this.loadDashboardUserData();
    }
  }

  // ── Extract userId from JWT ─────────────────────────────────────────────
  extractUserIdFromToken(): void {
    this.userId = this.auth.getUserId();
  }

  // ── Data loading ────────────────────────────────────────────────────────
  loadDashboardUserData(): void {
    this.apiService.getUserEmprunts(this.userId).subscribe({
      next: (e) => { this.userEmprunts = e || []; this.cdr.detectChanges(); },
      error: (err) => console.error('Erreur emprunts:', err)
    });
    this.apiService.getUserReservations(this.userId).subscribe({
      next: (r) => { this.userReservations = r || []; this.cdr.detectChanges(); },
      error: (err) => console.error('Erreur reservations:', err)
    });
    this.loadFavoris();
    this.loadNotifications();
  }

  loadFavoris(): void {
    this.apiService.getUserFavoris(this.userId).subscribe({
      next: (favoris: any) => {
        this.favoriBookIds = new Set((favoris || []).map((f: any) => f.book?.id));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  toggleFavori(book: any): void {
    const bookId = book.id;
    if (!bookId) {
      console.warn('toggleFavori: book.id is undefined', book);
      return;
    }
    if (this.favoriBookIds.has(bookId)) {
      this.apiService.removeFavori(this.userId, bookId).subscribe({
        next: () => {
          this.favoriBookIds.delete(bookId);
          this.favoriBookIds = new Set(this.favoriBookIds);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Erreur retrait favori:', err);
          const msg = err.error?.message || err.message || 'Erreur lors du retrait des favoris';
          this.showToast(msg, 'error');
        }
      });
    } else {
      this.apiService.addFavori(this.userId, bookId).subscribe({
        next: () => {
          this.favoriBookIds.add(bookId);
          this.favoriBookIds = new Set(this.favoriBookIds);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Erreur ajout favori:', err);
          const msg = err.error?.message || err.message || 'Erreur lors de l\'ajout aux favoris';
          this.showToast(msg, 'error');
        }
      });
    }
  }

  loadNotifications(): void {
    this.apiService.getUserNotifications(this.userId).subscribe({
      next: (n) => {
        this.notifications = n || [];
        this.unreadNotificationsCount = this.notifications.filter(x => !x.lu).length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur notifications:', err)
    });
  }

  loadBooks(): void {
    this.isLoading = true;
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.books = books || [];
        this.isLoading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.books = [];
        this.isLoading = false;
        this.errorMessage = 'Impossible de charger le catalogue. Vérifiez que le serveur est démarré.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── OPEN RESERVATION MODAL ──────────────────────────────────────────────
  openReservationModal(book: any): void {
    if (!book.disponible || this.isAlreadyReserved(book) || this.isAlreadyBorrowed(book)) return;
    this.modalBook = book;
    this.modalPreferredDate = '';
    this.modalNotes = '';
    this.modalUrgency = 'NORMAL';
    this.showReservationModal = true;
    this.cdr.detectChanges();
  }

  closeReservationModal(): void {
    this.showReservationModal = false;
    this.modalBook = null;
    this.cdr.detectChanges();
  }

  // ── Book Detail Modal ──────────────────────────────────────────────────
  openBookDetail(book: any): void {
    this.selectedBookDetail = book;
    this.showBookDetailModal = true;
    this.cdr.detectChanges();
  }

  closeBookDetail(): void {
    this.showBookDetailModal = false;
    this.selectedBookDetail = null;
    this.cdr.detectChanges();
  }

  confirmReservation(): void {
    if (!this.modalBook || this.isSubmittingReservation) return;
    if (!this.userId) {
      this.showToast('Impossible de vous identifier. Reconnectez-vous.', 'error');
      return;
    }
    const bookId = this.modalBook.id;
    if (!bookId) {
      this.showToast('Identifiant du livre introuvable.', 'error');
      return;
    }

    this.isSubmittingReservation = true;
    this.cdr.detectChanges();

    // Build notes with urgency
    let fullNotes = this.modalNotes.trim();
    if (this.modalUrgency === 'URGENT') {
      fullNotes = (fullNotes ? fullNotes + ' | ' : '') + '⚡ Demande URGENTE';
    } else if (this.modalUrgency === 'FLEXIBLE') {
      fullNotes = (fullNotes ? fullNotes + ' | ' : '') + 'Flexible sur la date';
    }

    this.apiService.createReservation(this.userId, bookId, fullNotes || undefined, this.modalPreferredDate || undefined)
      .subscribe({
        next: () => {
          this.isSubmittingReservation = false;
          const bookTitle = this.modalBook?.titre || '';
          this.showReservationModal = false;
          this.modalBook = null;
          this.showToast(`"${bookTitle}" réservé avec succès ! En attente de validation de l'administrateur.`, 'success');
          this.apiService.getUserReservations(this.userId).subscribe({
            next: (r) => { this.userReservations = r || []; this.cdr.detectChanges(); },
            error: (err: any) => {
              console.error('Erreur chargement favoris:', err);
            }
          });
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSubmittingReservation = false;
          const msg = err?.error?.message || err?.error || 'Erreur lors de la réservation.';
          this.showToast(typeof msg === 'string' ? msg : 'Erreur lors de la réservation.', 'error');
          this.cdr.detectChanges();
        }
      });
  }

  // ── RESERVE A BOOK (direct, kept for compatibility) ──────────────────────
  reserveBook(book: any): void {
    this.openReservationModal(book);
  }

  // ── CANCEL A RESERVATION ────────────────────────────────────────────────
  cancelReservation(res: any): void {
    if (this.cancellingResId === res.id) return;
    this.cancellingResId = res.id;
    this.cdr.detectChanges();

    this.apiService.cancelReservation(res.id).subscribe({
      next: () => {
        this.cancellingResId = null;
        this.userReservations = this.userReservations.filter(r => r.id !== res.id);
        this.showToast(`Réservation de "${res.book?.titre}" annulée.`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancellingResId = null;
        const msg = err?.error?.message || err?.error || "Erreur lors de l'annulation.";
        this.showToast(typeof msg === 'string' ? msg : "Erreur lors de l'annulation.", 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ── TOAST ───────────────────────────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { visible: true, message, type };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toast.visible = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  markNotifAsRead(notifId: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.apiService.markNotificationAsRead(notifId).subscribe({
      next: () => this.loadNotifications(),
      error: () => {}
    });
  }

  deleteNotif(notifId: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.apiService.deleteNotification(notifId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notifId);
        this.unreadNotificationsCount = this.notifications.filter(n => !n.lu).length;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  toggleNotifDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    this.cdr.detectChanges();
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.showNotificationsDropdown = false;
    this.cdr.detectChanges();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.cdr.detectChanges();
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    this.showNotificationsDropdown = false;
    this.cdr.detectChanges();
  }

  // ── Computed properties ─────────────────────────────────────────────────
  get activeLoansCount(): number {
    return this.userEmprunts.filter(e => e.statut === 'ACTIF').length;
  }

  get expiringLoansCount(): number {
    const today = new Date();
    return this.userEmprunts.filter(e => {
      if (e.statut !== 'ACTIF' || !e.dateRetourPrevue) return false;
      const diff = new Date(e.dateRetourPrevue).getTime() - today.getTime();
      const days = Math.ceil(diff / 86400000);
      return days >= 0 && days <= 3;
    }).length;
  }

  get overdueLoansCount(): number {
    const today = new Date();
    return this.userEmprunts.filter(e =>
      e.statut === 'ACTIF' && e.dateRetourPrevue && today > new Date(e.dateRetourPrevue)
    ).length;
  }

  get pendingReservationsCount(): number {
    return this.userReservations.filter(r => r.status === 'EN_ATTENTE').length;
  }

  get readyReservationsCount(): number {
    return this.userReservations.filter(r => r.status === 'APPROUVE').length;
  }

  isOverdue(emp: any): boolean {
    if (emp.statut !== 'ACTIF' || !emp.dateRetourPrevue) return false;
    return new Date() > new Date(emp.dateRetourPrevue);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getReaderName(): string {
    return this.auth.getReaderName();
  }

  getReaderEmail(): string {
    return this.auth.getEmail();
  }

  getInitial(): string {
    return this.getReaderName().charAt(0).toUpperCase();
  }

  get filteredBooks(): Book[] {
    let result = [...this.books];
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase();
      result = result.filter(b =>
        b.titre.toLowerCase().includes(t) ||
        b.auteur.toLowerCase().includes(t) ||
        b.isbn.toLowerCase().includes(t)
      );
    }
    if (this.selectedSort === 'titre') result.sort((a, b) => a.titre.localeCompare(b.titre));
    else if (this.selectedSort === 'auteur') result.sort((a, b) => a.auteur.localeCompare(b.auteur));
    return result;
  }

  isAlreadyReserved(book: Book & { id?: number }): boolean {
    const bookId = (book as any).id;
    return this.userReservations.some(r =>
      r.book?.id === bookId && (r.status === 'EN_ATTENTE' || r.status === 'APPROUVE')
    );
  }

  isAlreadyBorrowed(book: Book & { id?: number }): boolean {
    const bookId = (book as any).id;
    return this.userEmprunts.some(e => e.book?.id === bookId && e.statut === 'ACTIF');
  }

  getReservationStatusLabel(status: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      APPROUVE: 'Prête',
      RECUPERE: 'Récupérée',
      REFUSE: 'Refusée',
      ANNULE: 'Annulée'
    };
    return map[status] || status;
  }

  getReservationStatusStyle(status: string): { bg: string; color: string } {
    const map: Record<string, { bg: string; color: string }> = {
      EN_ATTENTE: { bg: '#fff7ed', color: '#c2410c' },
      APPROUVE:   { bg: '#dcfce7', color: '#15803d' },
      RECUPERE:   { bg: '#e0f2fe', color: '#0369a1' },
      REFUSE:     { bg: '#fee2e2', color: '#991b1b' },
      ANNULE:     { bg: '#f1f5f9', color: '#64748b' }
    };
    return map[status] || { bg: '#f1f5f9', color: '#64748b' };
  }

  goToProfile(): void { this.router.navigate(['/profile']); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getBookCoverStyle(book: any): { [key: string]: string } {
    if (!book) return {};
    const title = book.titre || book.title || '';
    const isbn = book.isbn;
    
    let fallbackStyle = this.getFallbackGradientStyle(title);
    
    if (isbn) {
      const cleanIsbn = isbn.replace(/[- ]/g, '');
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
      return {
        'background-image': `linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.15) 100%), url(${coverUrl})`,
        'background-size': 'cover',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'color': '#ffffff',
        'border': '1px solid rgba(255,255,255,0.08)'
      };
    }
    
    return fallbackStyle;
  }

  private getFallbackGradientStyle(title: string): { [key: string]: string } {
    const map: Record<string, { bg: string; color: string }> = {
      'harry': { bg: 'linear-gradient(135deg,#1b3c2e,#0d2117)', color: '#d4af37' },
      'petit prince': { bg: 'linear-gradient(135deg,#1e3c72,#2a5298)', color: '#f7f5ee' },
      '1984': { bg: 'linear-gradient(135deg,#6c1d1d,#3a0d0d)', color: '#eae5d8' },
      'étranger': { bg: 'linear-gradient(135deg,#2b3a4a,#15202b)', color: '#f7f5ee' },
      'etranger': { bg: 'linear-gradient(135deg,#2b3a4a,#15202b)', color: '#f7f5ee' },
      'da vinci': { bg: 'linear-gradient(135deg,#441616,#220808)', color: '#d4af37' },
      'misérables': { bg: 'linear-gradient(135deg,#2c3e50,#0f171e)', color: '#f7f5ee' },
      'geisha': { bg: 'linear-gradient(135deg,#421b4a,#1d0721)', color: '#fe346e' },
      'seigneur': { bg: 'linear-gradient(135deg,#22252a,#0c0d0f)', color: '#d4af37' },
      'alchimiste': { bg: 'linear-gradient(135deg,#6b4c1b,#3d270c)', color: '#eae5d8' },
      'fahrenheit': { bg: 'linear-gradient(135deg,#8b2600,#4a1200)', color: '#ffea00' },
      'sapiens': { bg: 'linear-gradient(135deg,#14532d,#052e16)', color: '#f7f5ee' },
    };
    const lower = title.toLowerCase();
    for (const key in map) {
      if (lower.includes(key)) {
        const m = map[key];
        return { background: m.bg, color: m.color, border: '1px solid rgba(255,255,255,0.08)' };
      }
    }
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    const hue = [25, 45, 145, 205, 265, 325][Math.abs(hash) % 6];
    return { background: `linear-gradient(135deg,hsl(${hue},45%,18%),hsl(${hue},50%,9%))`, color: '#fff', border: '1px solid rgba(255,255,255,0.08)' };
  }
}
