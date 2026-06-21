import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-profile.html',
  styleUrl: './admin-profile.css'
})
export class AdminProfileComponent implements OnInit {

  readerName = localStorage.getItem('reader_name') || 'Admin';
  readerEmail = this.getEmail();

  tempName = '';
  tempPassword = '';
  tempConfirmPassword = '';
  isEditing = false;

  constructor(
    private auth: Auth,
    private router: Router
  ) {
    this.tempName = this.readerName;
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  getEmail(): string {
    const token = localStorage.getItem('token');
    if (!token || token.split('.').length < 2) return 'admin@arche.com';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch {
      return 'admin@arche.com';
    }
  }

  getInitial(): string {
    return this.readerName.charAt(0).toUpperCase();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.auth.logout();
    localStorage.removeItem('reader_name');
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
    localStorage.setItem('reader_name', this.tempName.trim());
    this.readerName = this.tempName.trim();
    this.isEditing = false;
    alert('Profil administrateur mis à jour avec succès !');
  }
}
