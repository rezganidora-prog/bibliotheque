import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  sidebarCollapsed = false;
  searchTerm = '';
  readerName = localStorage.getItem('reader_name') || 'Admin';
  isLoading = true;
  activeSection = 'dashboard';
  pendingCount = 0;
  showUserMenu = false;

  todayDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  statsCards: any[] = [];
  recentBooks: any[] = [];
  recentActivities: any[] = [];
  top5Books: any[] = [];
  categoryStats: any[] = [];
  statusStats: any[] = [];
  totalBooksQty = 0;
  totalStatusCount = 0;

  categoriesConfig = [
    { name: 'Littérature', color: '#3b82f6' },
    { name: 'Science-fiction', color: '#22c55e' },
    { name: 'Histoire', color: '#f59e0b' },
    { name: 'Développement', color: '#8b5cf6' },
    { name: 'Jeunesse', color: '#ec4899' },
    { name: 'Autres', color: '#d1d5db' }
  ];

  showBookModal = false;
  isEditMode = false;
  currentBook: any = { titre: '', auteur: '', isbn: '', quantite: 1 };

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  setSection(section: string): void {
    this.activeSection = section;
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // 1. Charger les stats globales
    this.apiService.getStats().subscribe({
      next: (stats: any) => {
        this.updateStatsCards(stats);
        
        // 2. Charger les livres récents et calculer les catégories
        this.apiService.getAllBooks().subscribe({
          next: (books: any[]) => {
            this.recentBooks = books.slice(-5).reverse().map((b: any) => ({
              ...b,
              category: b.category || 'Général',
              date: new Date().toLocaleDateString('fr-FR')
            }));

            // Catégories
            const catCounts: Record<string, number> = {};
            this.categoriesConfig.forEach(c => catCounts[c.name] = 0);
            books.forEach((b: any) => {
              const cat = b.category || 'Autres';
              const matched = this.categoriesConfig.find(c => c.name.toLowerCase() === cat.toLowerCase());
              const catName = matched ? matched.name : 'Autres';
              catCounts[catName] += (b.quantite || 0);
            });
            this.totalBooksQty = Object.values(catCounts).reduce((a, b) => a + b, 0);
            this.categoryStats = this.categoriesConfig.map(c => {
              const count = catCounts[c.name];
              const percent = this.totalBooksQty > 0 ? Math.round((count / this.totalBooksQty) * 100) : 0;
              return { name: c.name, color: c.color, count, percent };
            });

            // 3. Charger les emprunts
            this.apiService.getEmprunts(0, 1000).subscribe({
              next: (emprunts: any) => {
                const list = emprunts.content || emprunts;
                
                // Activités & Retards
                this.populateActivities(list);
                const overdueList = list.filter((e: any) => {
                  if (e.statut !== 'ACTIF') return false;
                  const today = new Date();
                  const dueDate = new Date(e.dateRetourPrevue);
                  return today > dueDate;
                });
                this.pendingCount = overdueList.length;

                // Top 5 Books
                const counts: Record<string, { book: any, count: number }> = {};
                list.forEach((e: any) => {
                  if (e.book) {
                    const key = e.book.titre;
                    if (!counts[key]) {
                      counts[key] = { book: e.book, count: 0 };
                    }
                    counts[key].count++;
                  }
                });
                this.top5Books = Object.values(counts)
                  .sort((a: any, b: any) => b.count - a.count)
                  .slice(0, 5)
                  .map((item: any) => ({
                    titre: item.book.titre,
                    auteur: item.book.auteur,
                    count: item.count
                  }));

                // Statut des livres donut
                const activeCount = list.filter((e: any) => e.statut === 'ACTIF').length;
                const reservesCount = stats.reservations || 0;
                const disponiblesCount = books.reduce((sum: number, b: any) => sum + (b.disponible ? b.quantite : 0), 0);
                const indisponiblesCount = books.reduce((sum: number, b: any) => sum + (!b.disponible ? b.quantite : 0), 0);
                const totalStatus = disponiblesCount + activeCount + reservesCount + indisponiblesCount;

                this.statusStats = [
                  { name: 'Disponibles', color: '#22c55e', count: disponiblesCount, percent: totalStatus > 0 ? Math.round((disponiblesCount / totalStatus) * 100) : 0 },
                  { name: 'Empruntés', color: '#3b82f6', count: activeCount, percent: totalStatus > 0 ? Math.round((activeCount / totalStatus) * 100) : 0 },
                  { name: 'Réservés', color: '#f59e0b', count: reservesCount, percent: totalStatus > 0 ? Math.round((reservesCount / totalStatus) * 100) : 0 },
                  { name: 'Indisponibles', color: '#ef4444', count: indisponiblesCount, percent: totalStatus > 0 ? Math.round((indisponiblesCount / totalStatus) * 100) : 0 }
                ];
                this.totalStatusCount = totalStatus;
                
                this.isLoading = false;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Erreur emprunts:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('Erreur livres:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        console.error('Erreur chargement stats:', err);
        this.useDefaultStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatsCards(stats: any): void {
    const s = (html: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(html);
    this.statsCards = [
      {
        label: 'Livres disponibles',
        value: stats.disponible || 0,
        iconBg: '#eff6ff',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="width:24px;height:24px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`),
        change: '12.5%',
        positive: true
      },
      {
        label: 'Lecteurs inscrits',
        value: stats.etudiants || 0,
        iconBg: '#f0fdf4',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:24px;height:24px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`),
        change: '15.3%',
        positive: true
      },
      {
        label: 'Réservations',
        value: stats.reservations || 0,
        iconBg: '#fff7ed',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" style="width:24px;height:24px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`),
        change: '8.7%',
        positive: true
      },
      {
        label: 'Emprunts en cours',
        value: stats.emprunts || 0,
        iconBg: '#faf5ff',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" style="width:24px;height:24px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><polyline points="12 6 12 12 16 14"></polyline></svg>`),
        change: '5.2%',
        positive: false
      },
      {
        label: 'Retours en retard',
        value: stats.retards || 0,
        iconBg: '#fef2f2',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:24px;height:24px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`),
        change: '20.0%',
        positive: true
      }
    ];
  }

  useDefaultStats(): void {
    this.updateStatsCards({
      disponible: 1248,
      etudiants: 523,
      reservations: 320,
      emprunts: 187,
      retards: 24
    });
  }

  populateActivities(emprunts: any[]): void {
    const s = (html: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(html);
    const activities: any[] = [];
    emprunts.forEach((e: any) => {
      if (e.statut === 'ACTIF') {
        const today = new Date();
        const dueDate = new Date(e.dateRetourPrevue);
        if (today > dueDate) {
          activities.push({
            title: 'Emprunt en retard',
            detail: `"${e.book?.titre}" emprunté par ${e.user?.nom} est en retard`,
            time: 'En retard',
            iconBg: '#fef2f2',
            icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`)
          });
        } else {
          activities.push({
            title: 'Nouvel emprunt',
            detail: `"${e.book?.titre}" emprunté par ${e.user?.nom}`,
            time: new Date(e.dateEmprunt).toLocaleDateString('fr-FR'),
            iconBg: '#eff6ff',
            icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="width:16px;height:16px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><polyline points="12 6 12 12 16 14"></polyline></svg>`)
          });
        }
      } else if (e.statut === 'RETOURNE') {
        activities.push({
          title: 'Livre retourné',
          detail: `"${e.book?.titre}" rendu par ${e.user?.nom}`,
          time: e.dateRetourEffective ? new Date(e.dateRetourEffective).toLocaleDateString('fr-FR') : 'Rendu',
          iconBg: '#f0fdf4',
          icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"></polyline></svg>`)
        });
      }
    });

    this.recentActivities = activities.slice(0, 5);
  }

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

  logout(): void {
    this.auth.logout();
    localStorage.removeItem('reader_name');
    this.router.navigate(['/login']);
  }

  getBookThumbStyle(title: string): string {
    const map: Record<string, string> = {
      '1984': '#6c1d1d',
      'étranger': '#2b3a4a',
      'petit prince': '#1e3c72',
      'sapiens': '#14532d'
    };
    const lower = title.toLowerCase();
    for (const key in map) {
      if (lower.includes(key)) {
        return `background:${map[key]};color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border-radius:4px;`;
      }
    }
    return `background:#6b4c1b;color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border-radius:4px;`;
  }

  addBook(): void {
    this.isEditMode = false;
    this.currentBook = { titre: '', auteur: '', isbn: '', quantite: 1 };
    this.showBookModal = true;
  }

  closeModal(): void {
    this.showBookModal = false;
  }

  saveBook(): void {
    if (!this.currentBook.titre || !this.currentBook.auteur || !this.currentBook.isbn) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    alert('Livre enregistre avec succes !');
    this.closeModal();
    this.loadDashboardData();
  }

  getMockBooks(): any[] {
    return [
      { titre: "L'Étranger", auteur: 'Albert Camus', isbn: '9782070360024', quantite: 4, disponible: true, category: 'Littérature', date: '23 mai 2026' },
      { titre: '1984', auteur: 'George Orwell', isbn: '9782070368228', quantite: 2, disponible: true, category: 'Science-fiction', date: '22 mai 2026' }
    ];
  }

  getMockActivities(): any[] {
    return [
      { title: 'Nouvel emprunt', detail: '"1984" emprunté par Lucas Bernard', time: '10:30', iconBg: '#eff6ff', icon: '' }
    ];
  }
}
