import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Pour les formulaires basiques
import { Auth } from '../../services/auth'; // Import du service Auth
import { Router } from '@angular/router'; // Import du Router

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  registerData = {
    nom: '',
    email: '',
    password: ''
  };

  errorMessage = '';
  isLoading = false;

  constructor(private authService: Auth, private router: Router) {} // Injection du service Auth et du Router

  onRegister(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.register(this.registerData).subscribe({
      next: (res: any) => { // Type explicite 'any' pour la réponse
        this.isLoading = false;
        // Rediriger vers la page de connexion après une inscription réussie
        this.router.navigate(['/login']);
        // Optionnel: Afficher un message de succès
        // this.successMessage = 'Inscription réussie ! Veuillez vous connecter.';
      },
      error: (err: any) => { // Type explicite 'any' pour l'erreur
        this.isLoading = false;
        this.errorMessage = err.error?.message || "Erreur lors de l'inscription.";
        console.error('Erreur d\'inscription:', err);
      }
    });
  }
}
