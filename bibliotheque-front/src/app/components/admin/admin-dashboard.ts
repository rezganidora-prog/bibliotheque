import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

// ─── Chart point ────────────────────────────────────────────────────────────
interface ChartPoint { x: number; y: number; label: string; emprunts: number; retours: number; }

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
  readerName = 'Admin';
  isLoading = true;
  activeSection = 'dashboard';
  pendingCount = 0;
  showUserMenu = false;
  showDatePicker = false;

  todayDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Period filter ─────────────────────────────────────────────────────────
  chartPeriod: 7 | 30 | 90 = 30;
  chartPeriodLabel = '30 derniers jours';

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsCards: any[] = [];
  recentBooks: any[] = [];
  recentActivities: any[] = [];
  top5Books: any[] = [];
  categoryStats: any[] = [];
  statusStats: any[] = [];
  totalBooksQty = 0;
  totalStatusCount = 0;

  // ── Raw data (kept to re-filter on period change) ─────────────────────────
  private allEmprunts: any[] = [];
  private allBooks: any[] = [];

  // ── SVG Line chart ────────────────────────────────────────────────────────
  chartWidth = 660;
  chartHeight = 180;
  chartPadLeft = 30;
  chartPadBottom = 20;

  empruntPoints: ChartPoint[] = [];
  retourPoints: ChartPoint[] = [];
  empruntPath = '';
  retourPath = '';
  empruntFill = '';
  retourFill = '';
  chartYLabels: { y: number; label: string }[] = [];
  chartXLabels: { x: number; label: string }[] = [];
  chartMaxY = 1;

  // ── Tooltip ───────────────────────────────────────────────────────────────
  tooltip: { visible: boolean; x: number; y: number; label: string; emprunts: number; retours: number } =
    { visible: false, x: 0, y: 0, label: '', emprunts: 0, retours: 0 };

  // ── Donut helpers ─────────────────────────────────────────────────────────
  readonly DONUT_R = 60;
  readonly DONUT_CIRC = 2 * Math.PI * 60; // ≈ 377

  categoriesConfig = [
    { name: 'Littérature',     color: '#3b82f6' },
    { name: 'Science-fiction', color: '#22c55e' },
    { name: 'Histoire',        color: '#f59e0b' },
    { name: 'Développement',   color: '#8b5cf6' },
    { name: 'Jeunesse',        color: '#ec4899' },
    { name: 'Autres',          color: '#d1d5db' }
  ];

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
    this.readerName = this.auth.getReaderName() || 'Admin';
    this.loadDashboardData();
  }

  // ─── Period change ────────────────────────────────────────────────────────
  setPeriod(days: 7 | 30 | 90): void {
    this.chartPeriod = days;
    this.chartPeriodLabel = `${days} derniers jours`;
    if (this.allEmprunts.length) {
      this.buildChart(this.allEmprunts);
      this.cdr.detectChanges();
    }
  }

  // ─── Load all data ────────────────────────────────────────────────────────
  loadDashboardData(): void {
    this.isLoading = true;

    this.apiService.getStats().subscribe({
      next: (stats: any) => {
        this.updateStatsCards(stats);

        this.apiService.getAllBooks().subscribe({
          next: (books: any[]) => {
            this.allBooks = books;
            this.recentBooks = books.slice(-5).reverse().map((b: any) => ({
              ...b,
              category: b.category || 'Général',
              date: new Date().toLocaleDateString('fr-FR')
            }));

            // Category donut
            const catCounts: Record<string, number> = {};
            this.categoriesConfig.forEach(c => catCounts[c.name] = 0);
            books.forEach((b: any) => {
              const cat = b.category || 'Autres';
              const matched = this.categoriesConfig.find(c => c.name.toLowerCase() === cat.toLowerCase());
              catCounts[matched ? matched.name : 'Autres'] += (b.quantite || 0);
            });
            this.totalBooksQty = Object.values(catCounts).reduce((a, v) => a + v, 0);
            this.categoryStats = this.categoriesConfig.map(c => {
              const count = catCounts[c.name];
              const percent = this.totalBooksQty > 0 ? Math.round((count / this.totalBooksQty) * 100) : 0;
              return { name: c.name, color: c.color, count, percent };
            });

            this.apiService.getEmprunts(0, 2000).subscribe({
              next: (emprunts: any) => {
                const list: any[] = emprunts.content || emprunts;
                this.allEmprunts = list;

                this.populateActivities(list);
                this.buildTop5(list);
                this.buildStatusDonut(list, books, stats);
                this.buildChart(list);

                this.pendingCount = list.filter((e: any) =>
                  e.statut === 'ACTIF' && new Date() > new Date(e.dateRetourPrevue)
                ).length;

                this.isLoading = false;
                this.cdr.detectChanges();
              },
              error: () => { this.isLoading = false; this.cdr.detectChanges(); }
            });
          },
          error: () => { this.isLoading = false; this.cdr.detectChanges(); }
        });
      },
      error: () => {
        this.useDefaultStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Build SVG line chart ─────────────────────────────────────────────────
  buildChart(emprunts: any[]): void {
    const days = this.chartPeriod;
    const now = new Date();
    const buckets: { date: Date; emprunts: number; retours: number }[] = [];

    // Build daily buckets
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      buckets.push({ date: d, emprunts: 0, retours: 0 });
    }

    emprunts.forEach((e: any) => {
      if (e.dateEmprunt) {
        const de = new Date(e.dateEmprunt);
        de.setHours(0, 0, 0, 0);
        const b = buckets.find(b => b.date.getTime() === de.getTime());
        if (b) b.emprunts++;
      }
      if (e.dateRetourEffective) {
        const dr = new Date(e.dateRetourEffective);
        dr.setHours(0, 0, 0, 0);
        const b = buckets.find(b => b.date.getTime() === dr.getTime());
        if (b) b.retours++;
      }
    });

    // Determine grouping (weekly for 90 days, every 5 days for 30 days, daily for 7 days)
    let grouped: typeof buckets;
    if (days === 90) {
      grouped = this.groupByWeek(buckets);
    } else if (days === 30) {
      grouped = this.groupEveryN(buckets, 5);
    } else {
      grouped = buckets;
    }

    const maxVal = Math.max(...grouped.map(g => Math.max(g.emprunts, g.retours)), 1);
    this.chartMaxY = maxVal;

    const W = this.chartWidth;
    const H = this.chartHeight;
    const padL = this.chartPadLeft;
    const padB = this.chartPadBottom;
    const plotW = W - padL;
    const plotH = H - padB;

    const toX = (i: number) => padL + (i / (grouped.length - 1 || 1)) * plotW;
    const toY = (v: number) => padB + plotH - (v / maxVal) * plotH;

    // Y axis labels
    const steps = 4;
    this.chartYLabels = Array.from({ length: steps + 1 }, (_, i) => ({
      y: toY((maxVal / steps) * i),
      label: String(Math.round((maxVal / steps) * i))
    })).reverse();

    // X axis labels (show ~6 labels max)
    const labelStep = Math.max(1, Math.floor(grouped.length / 6));
    this.chartXLabels = grouped
      .map((g, i) => ({ x: toX(i), label: this.formatChartDate(g.date), i }))
      .filter((_, i) => i % labelStep === 0 || i === grouped.length - 1);

    // Points
    this.empruntPoints = grouped.map((g, i) => ({
      x: toX(i), y: toY(g.emprunts),
      label: this.formatChartDate(g.date),
      emprunts: g.emprunts, retours: g.retours
    }));
    this.retourPoints = grouped.map((g, i) => ({
      x: toX(i), y: toY(g.retours),
      label: this.formatChartDate(g.date),
      emprunts: g.emprunts, retours: g.retours
    }));

    this.empruntPath = this.toPolyline(this.empruntPoints);
    this.retourPath  = this.toPolyline(this.retourPoints);
    this.empruntFill = this.toFillPath(this.empruntPoints, H - padB, padL);
    this.retourFill  = this.toFillPath(this.retourPoints, H - padB, padL);
  }

  private groupByWeek(buckets: { date: Date; emprunts: number; retours: number }[]) {
    const weeks: { date: Date; emprunts: number; retours: number }[] = [];
    let cur: { date: Date; emprunts: number; retours: number } | null = null;
    buckets.forEach((b, i) => {
      const week = Math.floor(i / 7);
      if (!cur || weeks.length <= week) {
        cur = { date: b.date, emprunts: b.emprunts, retours: b.retours };
        weeks.push(cur);
      } else {
        cur.emprunts += b.emprunts;
        cur.retours  += b.retours;
      }
    });
    return weeks;
  }

  private groupEveryN(buckets: { date: Date; emprunts: number; retours: number }[], n: number) {
    const groups: { date: Date; emprunts: number; retours: number }[] = [];
    for (let i = 0; i < buckets.length; i += n) {
      const chunk = buckets.slice(i, i + n);
      groups.push({
        date: chunk[0].date,
        emprunts: chunk.reduce((s, b) => s + b.emprunts, 0),
        retours:  chunk.reduce((s, b) => s + b.retours,  0)
      });
    }
    return groups;
  }

  private toPolyline(pts: ChartPoint[]): string {
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  private toFillPath(pts: ChartPoint[], bottom: number, left: number): string {
    if (!pts.length) return '';
    const line = this.toPolyline(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${line} L${last.x.toFixed(1)},${bottom} L${first.x.toFixed(1)},${bottom} Z`;
  }

  private formatChartDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  showTooltip(pt: ChartPoint): void {
    this.tooltip = { visible: true, x: pt.x, y: pt.y, label: pt.label, emprunts: pt.emprunts, retours: pt.retours };
    this.cdr.detectChanges();
  }

  hideTooltip(): void {
    this.tooltip.visible = false;
    this.cdr.detectChanges();
  }

  // ─── Donut helpers ────────────────────────────────────────────────────────
  getDonutSlices(stats: { count: number; color: string; name: string }[], total: number) {
    let offset = 0;
    return stats.map(s => {
      const dash = total > 0 ? (s.count / total) * this.DONUT_CIRC : 0;
      const gap  = this.DONUT_CIRC - dash;
      const slice = { ...s, dash, gap, offset };
      offset += dash;
      return slice;
    });
  }

  get categorySlices() { return this.getDonutSlices(this.categoryStats, this.totalBooksQty); }
  get statusSlices()   { return this.getDonutSlices(this.statusStats,   this.totalStatusCount); }

  // ─── Status donut build ───────────────────────────────────────────────────
  buildStatusDonut(list: any[], books: any[], stats: any): void {
    const activeCount      = list.filter((e: any) => e.statut === 'ACTIF').length;
    const reservesCount    = stats.reservations || 0;
    const disponiblesCount = books.reduce((s: number, b: any) => s + (b.disponible ? (b.quantite || 0) : 0), 0);
    const indispCount      = books.reduce((s: number, b: any) => s + (!b.disponible ? (b.quantite || 0) : 0), 0);
    const total = disponiblesCount + activeCount + reservesCount + indispCount;

    this.statusStats = [
      { name: 'Disponibles',   color: '#22c55e', count: disponiblesCount,
        percent: total > 0 ? Math.round((disponiblesCount / total) * 100) : 0 },
      { name: 'Empruntés',     color: '#3b82f6', count: activeCount,
        percent: total > 0 ? Math.round((activeCount / total) * 100) : 0 },
      { name: 'Réservés',      color: '#f59e0b', count: reservesCount,
        percent: total > 0 ? Math.round((reservesCount / total) * 100) : 0 },
      { name: 'Indisponibles', color: '#ef4444', count: indispCount,
        percent: total > 0 ? Math.round((indispCount / total) * 100) : 0 }
    ];
    this.totalStatusCount = total;
  }

  // ─── Top 5 ────────────────────────────────────────────────────────────────
  buildTop5(list: any[]): void {
    const counts: Record<string, { book: any; count: number }> = {};
    list.forEach((e: any) => {
      if (e.book) {
        const k = e.book.titre;
        if (!counts[k]) counts[k] = { book: e.book, count: 0 };
        counts[k].count++;
      }
    });
    this.top5Books = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({ titre: item.book.titre, auteur: item.book.auteur, count: item.count }));
  }

  // ─── Activities ───────────────────────────────────────────────────────────
  populateActivities(emprunts: any[]): void {
    const s = (html: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(html);
    const activities: any[] = [];
    emprunts.forEach((e: any) => {
      if (e.statut === 'ACTIF') {
        const late = new Date() > new Date(e.dateRetourPrevue);
        activities.push({
          title: late ? 'Emprunt en retard' : 'Nouvel emprunt',
          detail: `"${e.book?.titre}" emprunté par ${e.user?.nom}${late ? ' — en retard' : ''}`,
          time: late ? 'En retard' : new Date(e.dateEmprunt).toLocaleDateString('fr-FR'),
          iconBg: late ? '#fef2f2' : '#eff6ff',
          icon: late
            ? s(`<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`)
            : s(`<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="width:16px;height:16px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><polyline points="12 6 12 12 16 14"/></svg>`)
        });
      } else if (e.statut === 'RETOURNE') {
        activities.push({
          title: 'Livre retourné',
          detail: `"${e.book?.titre}" rendu par ${e.user?.nom}`,
          time: e.dateRetourEffective ? new Date(e.dateRetourEffective).toLocaleDateString('fr-FR') : 'Rendu',
          iconBg: '#f0fdf4',
          icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:16px;height:16px"><polyline points="20 6 9 17 4 12"/></svg>`)
        });
      }
    });
    this.recentActivities = activities.slice(0, 6);
  }

  // ─── Stats cards ──────────────────────────────────────────────────────────
  updateStatsCards(stats: any): void {
    const s = (html: string): SafeHtml => this.sanitizer.bypassSecurityTrustHtml(html);
    this.statsCards = [
      { label: 'Livres disponibles', value: stats.disponible || 0, iconBg: '#eff6ff',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="width:24px;height:24px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`),
        change: '12.5%', positive: true },
      { label: 'Lecteurs inscrits', value: stats.etudiants || 0, iconBg: '#f0fdf4',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:24px;height:24px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`),
        change: '15.3%', positive: true },
      { label: 'Réservations', value: stats.reservations || 0, iconBg: '#fff7ed',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" style="width:24px;height:24px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`),
        change: '8.7%', positive: true },
      { label: 'Emprunts en cours', value: stats.emprunts || 0, iconBg: '#faf5ff',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" style="width:24px;height:24px"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><polyline points="12 6 12 12 16 14"/></svg>`),
        change: '5.2%', positive: false },
      { label: 'Retours en retard', value: stats.retards || 0, iconBg: '#fef2f2',
        icon: s(`<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:24px;height:24px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`),
        change: '20.0%', positive: false }
    ];
  }

  useDefaultStats(): void {
    this.updateStatsCards({ disponible: 0, etudiants: 0, reservations: 0, emprunts: 0, retards: 0 });
  }

  // ─── UI helpers ───────────────────────────────────────────────────────────
  getInitial(): string { return this.readerName.charAt(0).toUpperCase(); }

  setSection(section: string): void { this.activeSection = section; }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (this.sidebarCollapsed) this.showUserMenu = false;
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  toggleDatePicker(event: Event): void {
    event.stopPropagation();
    this.showDatePicker = !this.showDatePicker;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.showUserMenu = false;
    this.showDatePicker = false;
  }

  navigateTo(route: string): void { this.router.navigate([route]); }
  goToProfile(): void { this.router.navigate(['/admin/profile']); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getBookThumbStyle(title: string): string {
    const map: Record<string, string> = {
      '1984': '#6c1d1d', 'étranger': '#2b3a4a', 'petit prince': '#1e3c72',
      'sapiens': '#14532d', 'misérables': '#653b1b', 'seigneur': '#1f2937',
      'harry potter': '#5b21b6', 'alchimiste': '#db2777'
    };
    const lower = title.toLowerCase();
    for (const key in map) {
      if (lower.includes(key)) {
        return `background:${map[key]};color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border-radius:4px;`;
      }
    }
    return `background:#6b4c1b;color:#d4af37;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border-radius:4px;`;
  }
}
