import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  isLoginMode = true;
  isPasswordVisible = false;

  credentials = {
    nom: '',
    email: '',
    password: ''
  };

  rememberMe = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si déjà connecté, rediriger directement vers le dashboard approprié
    if (this.auth.isLoggedIn()) {
      const role = this.getReaderRole();
      if (role === 'ADMIN') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }

    // Récupérer l'email mémorisé pour le pré-remplissage
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      this.credentials.email = savedEmail;
      this.rememberMe = true;
    }
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  getReaderName(): string {
    return localStorage.getItem('reader_name') || 'Lecteur';
  }

  getReaderEmail(): string {
    const token = localStorage.getItem('token');
    if (!token || typeof token !== 'string') return '';
    const parts = token.split('.');
    if (parts.length < 2) return '';
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || '';
    } catch (e) { return ''; }
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

  onAccessBooks() {
    const role = this.getReaderRole();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  onLogout() {
    this.auth.logout();
    localStorage.removeItem('reader_name');
  }

  setMode(loginMode: boolean) {
    this.isLoginMode = loginMode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // ===== CONNEXION ET INSCRIPTION CLASSIQUE JWT =====
  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    if (this.isLoginMode) {
      // MODE CONNEXION
      this.loginAndRedirect(this.credentials.email, this.credentials.password);
    } else {
      // MODE INSCRIPTION + connexion automatique
      const regData = {
        nom: this.credentials.nom,
        email: this.credentials.email,
        password: this.credentials.password
      };

      this.auth.register(regData).subscribe({
        next: () => {
          localStorage.setItem('reader_name', regData.nom);
          // Connexion automatique après inscription
          this.loginAndRedirect(regData.email, regData.password);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || "Erreur lors de la création de l'abonnement.";
        }
      });
    }
  }

  // Méthode centralisée : Connexion + Redirection vers le dashboard
  private loginAndRedirect(email: string, password: string) {
    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.isLoading = false;
        // Stocker le nom si pas déjà fait
        if (!localStorage.getItem('reader_name')) {
          localStorage.setItem('reader_name', email.split('@')[0]);
        }

        // Gérer le souvenir de l'adresse email
        if (this.rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }

        // REDIRECTION VERS LE DASHBOARD APPROPRIÉ
        const role = this.getReaderRole();
        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Identifiants invalides ou serveur indisponible.';
      }
    });
  }
}
