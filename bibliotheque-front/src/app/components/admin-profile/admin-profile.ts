import { Component, OnInit, HostListener } from '@angular/core';
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
  userId = 0;

  tempName = '';
  tempPassword = '';
  tempConfirmPassword = '';
  isEditing = false;

  sidebarCollapsed = false;
  showUserMenu = false;

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router
  ) {
    this.readerName = this.auth.getReaderName() || 'Admin';
    this.readerEmail = this.auth.getEmail() || 'admin@arche.com';
    this.tempName = this.readerName;
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = this.auth.getUserId();
  }

  getEmail(): string {
    return this.auth.getEmail() || 'admin@arche.com';
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

    const payload: { nom: string; password?: string } = { nom: this.tempName.trim() };
    if (this.tempPassword) {
      payload.password = this.tempPassword;
    }

    this.apiService.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.auth.setReaderName(this.tempName.trim());
        this.readerName = this.tempName.trim();
        this.isEditing = false;
        alert('Profil administrateur mis à jour avec succès !');
      },
      error: (err) => {
        console.error('Erreur mise à jour profil admin:', err);
        alert('Erreur lors de la mise à jour du profil.');
      }
    });
  }
}
