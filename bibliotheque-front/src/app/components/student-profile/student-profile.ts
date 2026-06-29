import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('fileInput') fileInput!: ElementRef;

  readerName = 'Etudiant';
  readerEmail = '';
  readerUniversite = '';
  readerTelephone = '';
  userId: number = 0;
  memberSince = 'Janvier 2025';
  avatarImage: string | null = null;

  sidebarCollapsed = false;
  showUserMenu = false;
  activeTab: string = 'overview';
  borrowHistory: any[] = [];
  activeBorrowCount = 0;
  favoriteBooks: any[] = [];
  favoriBookIds: Set<number> = new Set();
  activeReservationsCount = 0;

  tempName = '';
  tempEmail = '';
  tempUniversite = '';
  tempTelephone = '';
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
    this.readerName = this.auth.getReaderName() || 'Etudiant';
    this.readerEmail = this.auth.getEmail() || '';
    this.tempName = this.readerName;
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = this.auth.getUserId();
    if (!this.userId) {
      this.errorMessage = 'Impossible d\'identifier votre compte. Reconnectez-vous.';
      this.isLoading = false;
      return;
    }
    this.loadUserProfile();
    this.loadBorrowHistory();
    this.loadFavoriteBooks();
    this.loadReservations();
    this.loadAvatar();
  }

  loadUserProfile(): void {
    this.apiService.getStudentById(this.userId).subscribe({
      next: (user: any) => {
        this.readerName = user.nom || this.readerName;
        this.readerEmail = user.email || '';
        this.readerUniversite = user.universite || '';
        this.readerTelephone = user.telephone || '';
        this.auth.setReaderName(this.readerName);
      },
      error: () => {}
    });
  }

  loadBorrowHistory(): void {
    this.isLoading = true;
    this.apiService.getUserEmprunts(this.userId).subscribe({
      next: (emprunts: any) => {
        const list = emprunts || [];
        this.borrowHistory = list.map((e: any) => ({
          title: e.book?.titre || 'Inconnu',
          author: e.book?.auteur || 'Inconnu',
          borrowDate: e.dateEmprunt || '',
          returnDate: e.dateRetourPrevue || '',
          status: e.statut === 'ACTIF' ? 'active' : 'returned'
        }));
        this.activeBorrowCount = list.filter((e: any) => e.statut === 'ACTIF').length;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement emprunts:', err);
        this.borrowHistory = [];
        this.isLoading = false;
      }
    });
  }

  loadReservations(): void {
    this.apiService.getUserReservations(this.userId).subscribe({
      next: (reservations: any) => {
        const list = reservations || [];
        this.activeReservationsCount = list.filter((r: any) =>
          r.statut === 'EN_ATTENTE' || r.statut === 'APPROUVEE'
        ).length;
      },
      error: () => {
        this.activeReservationsCount = 0;
      }
    });
  }

  loadFavoriteBooks(): void {
    this.apiService.getUserFavoris(this.userId).subscribe({
      next: (favoris: any) => {
        this.favoriteBooks = (favoris || []).map((f: any) => ({
          id: f.book?.id,
          title: f.book?.titre,
          author: f.book?.auteur,
          isbn: f.book?.isbn,
          favoriteId: f.id
        }));
        this.favoriBookIds = new Set(this.favoriteBooks.map((b: any) => b.id));
      },
      error: () => {
        this.favoriteBooks = [];
      }
    });
  }

  getInitial(): string {
    return this.readerName.charAt(0).toUpperCase();
  }

  loadAvatar(): void {
    const stored = localStorage.getItem(`avatar_${this.userId}`);
    if (stored) {
      this.avatarImage = stored;
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarImage = e.target.result;
        localStorage.setItem(`avatar_${this.userId}`, this.avatarImage!);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getBookCoverStyle(book: any): { [key: string]: string } {
    if (!book) return {};
    const title = book.title || book.titre || (typeof book === 'string' ? book : '');
    const isbn = book.isbn;
    
    // Fallback gradient style
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
    return this.auth.getRole();
  }

  navigateTo(route: string): void {
    if (route === '/dashboard' && this.getReaderRole() === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate([route]);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.tempName = this.readerName;
      this.tempEmail = this.readerEmail;
      this.tempUniversite = this.readerUniversite;
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

    const data: any = { nom: this.tempName.trim() };
    if (this.tempEmail && this.tempEmail !== this.readerEmail) {
      data.email = this.tempEmail.trim();
    }
    if (this.tempUniversite !== this.readerUniversite) {
      data.universite = this.tempUniversite;
    }
    if (this.tempTelephone !== this.readerTelephone) {
      data.telephone = this.tempTelephone;
    }
    if (this.tempPassword) {
      data.password = this.tempPassword;
    }

    this.apiService.updateStudentProfile(this.userId, data).subscribe({
      next: () => {
        this.auth.setReaderName(this.tempName.trim());
        this.readerName = this.tempName.trim();
        this.readerEmail = this.tempEmail || this.readerEmail;
        this.readerUniversite = this.tempUniversite;
        this.readerTelephone = this.tempTelephone;
        this.isEditing = false;
        alert('Profil mis à jour avec succès !');
      },
      error: (err: any) => {
        console.error('Erreur mise à jour profil:', err);
        alert('Erreur lors de la mise à jour du profil.');
      }
    });
  }
}
