import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css'
})
export class AdminProfileComponent implements OnInit {

  readerName = 'Admin';
  readerEmail = '';
  readerTelephone = '';
  userId = 0;

  tempName = '';
  tempTelephone = '';
  tempPassword = '';
  tempConfirmPassword = '';
  isEditing = false;

  sidebarCollapsed = false;
  showUserMenu = false;

  recentEmprunts: any[] = [];
  isLoading = true;

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.readerName = this.auth.getReaderName() || 'Admin';
    this.readerEmail = this.auth.getEmail() || '';
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = this.auth.getUserId();
    this.loadAdminProfile();
    this.loadRecentActivities();
  }

  loadAdminProfile(): void {
    if (!this.userId) return;
    this.apiService.getUserById(this.userId).subscribe({
      next: (user: any) => {
        this.readerName = user.nom || this.readerName;
        this.readerEmail = user.email || this.readerEmail;
        this.readerTelephone = user.telephone || '';
        this.auth.setReaderName(this.readerName);
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges()
    });
  }

  loadRecentActivities(): void {
    this.isLoading = true;
    this.apiService.getEmprunts(0, 10).subscribe({
      next: (res: any) => {
        const list = res.content || res || [];
        this.recentEmprunts = list.map((e: any) => ({
          id: e.id,
          title: e.book?.titre || 'Inconnu',
          user: e.user?.nom || 'Inconnu',
          date: e.dateEmprunt || '',
          status: e.statut === 'ACTIF' ? 'En cours' : 'Retourné',
          overdue: e.statut === 'ACTIF' && e.dateRetourPrevue && new Date(e.dateRetourPrevue) < new Date()
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.tempName = this.readerName;
      this.tempTelephone = this.readerTelephone;
      this.tempPassword = '';
      this.tempConfirmPassword = '';
    }
  }

  saveProfile(): void {
    if (!this.tempName.trim()) {
      alert('Le nom ne peut pas être vide.');
      return;
    }
    if (this.tempPassword && this.tempPassword !== this.tempConfirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!this.userId) {
      alert('Impossible d\'identifier votre compte. Reconnectez-vous.');
      return;
    }

    const payload: any = { nom: this.tempName.trim() };
    if (this.tempTelephone !== this.readerTelephone) {
      payload.telephone = this.tempTelephone;
    }
    if (this.tempPassword) {
      payload.password = this.tempPassword;
    }

    this.apiService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.auth.setReaderName(this.tempName.trim());
        this.readerName = this.tempName.trim();
        this.readerTelephone = this.tempTelephone;
        this.isEditing = false;
        this.cdr.detectChanges();
        alert('Profil administrateur mis à jour avec succès !');
      },
      error: (err) => {
        console.error('Erreur mise à jour profil admin:', err);
        alert('Erreur lors de la mise à jour du profil.');
      }
    });
  }
}
