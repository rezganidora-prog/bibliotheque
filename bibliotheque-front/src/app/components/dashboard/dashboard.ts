import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { BookService, Book } from '../../services/book';
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

  // États pour la recherche et le tri
  searchTerm: string = '';
  selectedCategory: string = 'Toutes catégories';
  selectedSort: string = 'Trier par';

  // Activités récentes (simulées pour correspondre à la maquette)
  recentActivities = [
    {
      type: 'reservation',
      title: 'Réservation confirmée',
      detail: 'Le Petit Prince',
      date: 'Il y a 2 jours'
    },
    {
      type: 'emprunt',
      title: 'Emprunt prolongé',
      detail: '1984',
      date: 'Il y a 1 semaine'
    },
    {
      type: 'favoris',
      title: 'Livre ajouté aux favoris',
      detail: "L'Alchimiste",
      date: 'Il y a 2 semaines'
    }
  ];

  constructor(
    private auth: Auth,
    private bookService: BookService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBooks();
  }
loadBooks() {
  this.isLoading = true;

  this.bookService.getAllBooks().subscribe({
    next: (books) => {

      console.log('Livres reçus du backend :', books);

      if (books && books.length > 0) {
        this.books = books;
      } else {
        console.log('Aucun livre dans la base, utilisation du mock');
        this.books = this.getMockBooks();
      }

      this.isLoading = false;
    },

    error: (err) => {
      console.error('Erreur API :', err);

      this.books = this.getMockBooks();
      this.isLoading = false;
    }
  });
}


  // Filtrer et trier les livres en fonction des critères
  get filteredBooks(): Book[] {
    let result = [...this.books];

    // Recherche par titre, auteur ou ISBN
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(book => 
        book.titre.toLowerCase().includes(term) ||
        book.auteur.toLowerCase().includes(term) ||
        book.isbn.toLowerCase().includes(term)
      );
    }

    // Tri (Optionnel)
    if (this.selectedSort === 'titre') {
      result.sort((a, b) => a.titre.localeCompare(b.titre));
    } else if (this.selectedSort === 'auteur') {
      result.sort((a, b) => a.auteur.localeCompare(b.auteur));
    }

    return result;
  }

  // Style de couverture personnalisé pour chaque livre
  getBookCoverStyle(title: string): { [key: string]: string } {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('harry') || titleLower.includes('potter')) {
      return {
        background: 'linear-gradient(135deg, #1b3c2e 0%, #0d2117 100%)',
        color: '#d4af37',
        border: '1px solid rgba(212, 175, 55, 0.3)'
      };
    }
    if (titleLower.includes('petit prince')) {
      return {
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: '#f7f5ee',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      };
    }
    if (titleLower.includes('1984')) {
      return {
        background: 'linear-gradient(135deg, #6c1d1d 0%, #3a0d0d 100%)',
        color: '#eae5d8',
        border: '1px solid rgba(212, 175, 55, 0.2)'
      };
    }
    if (titleLower.includes('étranger') || titleLower.includes('etranger')) {
      return {
        background: 'linear-gradient(135deg, #2b3a4a 0%, #15202b 100%)',
        color: '#f7f5ee',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      };
    }
    if (titleLower.includes('da vinci') || titleLower.includes('code')) {
      return {
        background: 'linear-gradient(135deg, #441616 0%, #220808 100%)',
        color: '#d4af37',
        border: '1px solid rgba(212, 175, 55, 0.3)'
      };
    }
    if (titleLower.includes('misérables') || titleLower.includes('miserables')) {
      return {
        background: 'linear-gradient(135deg, #2c3e50 0%, #0f171e 100%)',
        color: '#f7f5ee',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      };
    }
    if (titleLower.includes('geisha')) {
      return {
        background: 'linear-gradient(135deg, #421b4a 0%, #1d0721 100%)',
        color: '#fe346e',
        border: '1px solid rgba(254, 52, 110, 0.2)'
      };
    }
    if (titleLower.includes('seigneur') || titleLower.includes('anneaux')) {
      return {
        background: 'linear-gradient(135deg, #22252a 0%, #0c0d0f 100%)',
        color: '#d4af37',
        border: '1px solid rgba(212, 175, 55, 0.3)'
      };
    }
    if (titleLower.includes('alchimiste')) {
      return {
        background: 'linear-gradient(135deg, #6b4c1b 0%, #3d270c 100%)',
        color: '#eae5d8',
        border: '1px solid rgba(212, 175, 55, 0.2)'
      };
    }
    if (titleLower.includes('fahrenheit')) {
      return {
        background: 'linear-gradient(135deg, #8b2600 0%, #4a1200 100%)',
        color: '#ffea00',
        border: '1px solid rgba(255, 234, 0, 0.2)'
      };
    }

    // Fallback dynamique
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [25, 45, 145, 205, 265, 325];
    const hue = hues[Math.abs(hash) % hues.length];
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 45%, 20%) 0%, hsl(${hue}, 50%, 10%) 100%)`,
      color: '#ffffff',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    };
  }

  getReaderName(): string {
    return localStorage.getItem('reader_name') || 'Dorra';
  }

  getReaderEmail(): string {
    const token = localStorage.getItem('token');
    if (!token || typeof token !== 'string') return 'dorra.etudiante@exemple.com';
    const parts = token.split('.');
    if (parts.length < 2) return 'dorra.etudiante@exemple.com';
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || 'dorra.etudiante@exemple.com';
    } catch (e) {
      return 'dorra.etudiante@exemple.com';
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.auth.logout();
    localStorage.removeItem('reader_name');
    this.router.navigate(['/login']);
  }

  getMockBooks(): Book[] {
    return [
      { titre: "Harry Potter à l'école des sorciers", auteur: "J.K. Rowling", isbn: "9782070518425", quantite: 3, disponible: true },
      { titre: "Le Petit Prince", auteur: "Antoine de Saint-Exupéry", isbn: "9782070612758", quantite: 5, disponible: true },
      { titre: "1984", auteur: "George Orwell", isbn: "9782070368228", quantite: 2, disponible: true },
      { titre: "L'Étranger", auteur: "Albert Camus", isbn: "9782070360024", quantite: 4, disponible: true },
      { titre: "Da Vinci Code", auteur: "Dan Brown", isbn: "9782253123514", quantite: 0, disponible: false },
      { titre: "Les Misérables", auteur: "Victor Hugo", isbn: "9782253006275", quantite: 6, disponible: true },
      { titre: "Mémoires d'une geisha", auteur: "Arthur Golden", isbn: "9782253147824", quantite: 2, disponible: true },
      { titre: "Le Seigneur des Anneaux", auteur: "J.R.R. Tolkien", isbn: "9782266154116", quantite: 1, disponible: true },
      { titre: "L'Alchimiste", auteur: "Paulo Coelho", isbn: "9782290004449", quantite: 3, disponible: true },
      { titre: "Fahrenheit 451", auteur: "Ray Bradbury", isbn: "9782070415328", quantite: 2, disponible: true }
    ];
  }
}
