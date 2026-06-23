import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-utilisateurs.html',
  styleUrl: './admin-utilisateurs.css'
})
export class AdminUtilisateursComponent implements OnInit {

  students: any[] = [];
  isLoading = true;
  searchTerm = '';
  roleFilter = 'Tous';

  roles = ['Tous', 'STUDENT', 'ADMIN'];

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.apiService.getAllStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredStudents(): any[] {
    return this.students.filter(student => {
      const matchRole = this.roleFilter === 'Tous' || student.role === this.roleFilter;
      const matchSearch = student.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchRole && matchSearch;
    });
  }

  deleteStudent(id: number, nom: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${nom}" ?`)) {
      this.apiService.deleteStudent(id).subscribe({
        next: () => {
          alert('Utilisateur supprimé avec succès !');
          this.loadStudents();
        },
        error: (err) => {
          console.error('Erreur suppression utilisateur:', err);
          alert('Erreur lors de la suppression de l\'utilisateur.');
        }
      });
    }
  }

  getRoleBadgeColor(role: string): string {
    return role === 'ADMIN' ? '#d4af37' : '#3b82f6';
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}