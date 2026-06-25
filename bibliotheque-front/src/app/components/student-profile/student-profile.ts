import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfileComponent implements OnInit {

  readerName = localStorage.getItem('reader_name') || 'Etudiant';
  readerEmail = this.getEmail();
  userId: number = 0;

  activeTab: string = 'overview';
  borrowHistory: any[] = [];
  favoriteBooks: any[] = [];

  tempName = '';
  tempPassword = '';
  tempConfirmPassword = '';
  isEditing = false;
  isLoading = true;
  errorMessage = '';

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router
  ) {
    this.tempName = this.readerName;
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.getUserIdFromToken();
    if (!this.userId) {
      this.errorMessage = 'Impossible d\'identifier votre compte. Reconnectez-vous.';
      this.isLoading = false;
      return;
    }
    this.loadBorrowHistory();
    this.loadFavoriteBooks();
  }

  getUserIdFromToken(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = payload.userId || payload.id || 0;
    } catch {
      this.userId = 0;
    }
  }

  loadBorrowHistory(): void {
    this.isLoading = true;
    this.apiService.getUserEmprunts(this.userId).subscribe({
      next: (emprunts: any) => {
        this.borrowHistory = (emprunts || []).map((e: any) => ({
          titre: e.book?.titre,
          auteur: e.book?.auteur,
          dateEmprunt: e.dateEmprunt,
          dateRetourPrevue: e.dateRetourPrevue,
          statut: e.statut,
          status: e.statut === 'ACTIF' ? 'active' : 'returned'
        }));
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement emprunts:', err);
        this.borrowHistory = [];
        this.isLoading = false;
      }
    });
  }

  loadFavoriteBooks(): void {
    this.apiService.getAllBooks().subscribe({
      next: (books: any) => {
        this.favoriteBooks = (books || []).slice(0, 6).map((b: any) => ({
          titre: b.titre,
          auteur: b.auteur
        }));
      },
      error: () => {
        this.favoriteBooks = [];
      }
    });
  }

  getEmail(): string {
    const token = localStorage.getItem('token');
    if (!token || token.split('.').length < 2) return 'etudiant@exemple.com';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || 'etudiant@exemple.com';
    } catch {
      return 'etudiant@exemple.com';
    }
  }

  getInitial(): string {
    return this.readerName.charAt(0).toUpperCase();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getBookCoverStyle(title: string): { [key: string]: string } {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('harry') || titleLower.includes('potter')) {
      return { background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: '#f0f0f0' };
    }
    if (titleLower.includes('petit prince')) {
      return { background: 'linear-gradient(135deg, #f7dc6f 0%, #f1c40f 100%)', color: '#333333' };
    }
    if (titleLower.includes('étranger') || titleLower.includes('etranger')) {
      return { background: 'linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%)', color: '#333333' };
    }
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [20, 60, 120, 180, 240, 300];
    const hue = hues[Math.abs(hash) % hues.length];
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 60%, 40%) 0%, hsl(${hue}, 50%, 30%) 100%)`,
      color: '#f0f0f0'
    };
  }

  getReaderRole(): string {
    const token = localStorage.getItem('token');
    if (!token || typeof token !== 'string') return '';
    const parts = token.split('.');
    if (parts.length < 2) return '';
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload.role || '';
    } catch {
      return '';
    }
  }

  navigateTo(route: string): void {
    if (route === '/dashboard' && this.getReaderRole() === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate([route]);
    }
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

    this.apiService.updateStudentProfile(this.userId, this.tempName.trim(), this.tempPassword || undefined).subscribe({
      next: () => {
        localStorage.setItem('reader_name', this.tempName.trim());
        this.readerName = this.tempName.trim();
        this.isEditing = false;
        alert('Profil mis à jour avec succes !');
      },
      error: (err: any) => {
        console.error('Erreur mise à jour profil:', err);
        alert('Erreur lors de la mise à jour du profil.');
      }
    });
  }
}
