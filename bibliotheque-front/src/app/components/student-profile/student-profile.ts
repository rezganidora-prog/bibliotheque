import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

interface BorrowEntry {
  title: string;
  author: string;
  borrowDate: string;
  returnDate: string;
  status: 'active' | 'returned';
}

interface FavoriteBook {
  title: string;
  author: string;
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfileComponent implements OnInit {

  readerName =
    localStorage.getItem('reader_name') || 'Dorra';

  readerEmail = this.getEmail();

  // Onglet actif du profil
  activeTab: string = 'overview';

  // Historique d'emprunts (simulé)
  borrowHistory: BorrowEntry[] = [
    {
      title: 'Le Petit Prince',
      author: 'Antoine de Saint-Exupéry',
      borrowDate: '12 Mai 2025',
      returnDate: '26 Mai 2025',
      status: 'returned'
    },
    {
      title: '1984',
      author: 'George Orwell',
      borrowDate: '1 Juin 2025',
      returnDate: '15 Juin 2025',
      status: 'active'
    },
    {
      title: "L'Alchimiste",
      author: 'Paulo Coelho',
      borrowDate: '20 Avril 2025',
      returnDate: '4 Mai 2025',
      status: 'returned'
    },
    {
      title: 'Fahrenheit 451',
      author: 'Ray Bradbury',
      borrowDate: '8 Mars 2025',
      returnDate: '22 Mars 2025',
      status: 'returned'
    }
  ];

  // Livres favoris (simulé)
  favoriteBooks: FavoriteBook[] = [
    { title: "Harry Potter à l'école des sorciers", author: 'J.K. Rowling' },
    { title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry' },
    { title: "L'Étranger", author: 'Albert Camus' },
    { title: 'Les Misérables', author: 'Victor Hugo' },
    { title: "Mémoires d'une geisha", author: 'Arthur Golden' },
    { title: 'Le Seigneur des Anneaux', author: 'J.R.R. Tolkien' }
  ];

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

    if (!token || token.split('.').length < 2) return 'dorra.etudiante@exemple.com';

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch {
      return 'dorra.etudiante@exemple.com';
    }
  }

  getInitial(): string {
    return this.readerName.charAt(0).toUpperCase();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Style de couverture pour les favoris (même logique que dashboard)
  getBookCoverStyle(title: string): { [key: string]: string } {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('harry') || titleLower.includes('potter')) {
      return { background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: '#f0f0f0' }; // Gris-bleu foncé
    }
    if (titleLower.includes('petit prince')) {
      return { background: 'linear-gradient(135deg, #f7dc6f 0%, #f1c40f 100%)', color: '#333333' }; // Jaune/Or clair
    }
    if (titleLower.includes('étranger') || titleLower.includes('etranger')) {
      return { background: 'linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%)', color: '#333333' }; // Gris clair
    }
    if (titleLower.includes('misérables') || titleLower.includes('miserables')) {
      return { background: 'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)', color: '#f0f0f0' }; // Violet
    }
    if (titleLower.includes('geisha')) {
      return { background: 'linear-gradient(135deg, #f3a683 0%, #f7d794 100%)', color: '#333333' }; // Pêche/Or doux
    }
    if (titleLower.includes('seigneur') || titleLower.includes('anneaux')) {
      return { background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', color: '#f0f0f0' }; // Vert
    }
    if (titleLower.includes('alchimiste')) {
      return { background: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)', color: '#333333' }; // Orange/Or
    }
    if (titleLower.includes('fahrenheit')) {
      return { background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)', color: '#f0f0f0' }; // Orange/Rouge intense
    }

    // Fallback dynamique
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [20, 60, 120, 180, 240, 300]; // Gamme de teintes plus équilibrée
    const hue = hues[Math.abs(hash) % hues.length];
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 60%, 40%) 0%, hsl(${hue}, 50%, 30%) 100%)`, // Dégradé plus lumineux
      color: '#ae9e9e'
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
    } catch (e) { return ''; }
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
    localStorage.setItem('reader_name', this.tempName.trim());
    this.readerName = this.tempName.trim();
    this.isEditing = false;
    alert('Profil mis à jour avec succès !');
  }
}