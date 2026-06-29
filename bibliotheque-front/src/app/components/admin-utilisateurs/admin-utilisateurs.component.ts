import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
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

  users: any[] = [];
  isLoading = true;
  searchTerm = '';
  
  // Sidebar state
  sidebarCollapsed = false;
  showUserMenu = false;
  readerName = localStorage.getItem('reader_name') || 'Admin';

  // Modal CRUD state
  showUserModal = false;
  isEditMode = false;
  currentUser: any = {
    nom: '',
    email: '',
    password: '',
    role: 'STUDENT',
    active: true
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private auth: Auth,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.apiService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get baseFilteredUsers(): any[] {
    let list = this.users;

    if (this.searchTerm.trim()) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(u =>
        (u.nom || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s)
      );
    }
    return list;
  }

  // ----- Pagination -----
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.baseFilteredUsers.length / this.pageSize));
  }

  get pagedUsers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.baseFilteredUsers.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  // ----- User Actions -----
  openAddModal(): void {
    this.isEditMode = false;
    this.currentUser = {
      nom: '',
      email: '',
      password: '',
      role: 'STUDENT',
      active: true
    };
    this.showUserModal = true;
  }

  openEditModal(user: any): void {
    this.isEditMode = true;
    this.currentUser = {
      ...user,
      password: '' // Don't expose password
    };
    this.showUserModal = true;
  }

  closeModal(): void {
    this.showUserModal = false;
  }

  saveUser(): void {
    if (!this.currentUser.nom || !this.currentUser.email) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (this.isEditMode) {
      // If password field is empty, don't update password
      const payload = { ...this.currentUser };
      if (!payload.password) delete payload.password;

      this.apiService.updateUser(this.currentUser.id, payload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur mise à jour utilisateur:', err);
          alert('Erreur lors de la mise à jour de l\'utilisateur.');
        }
      });
    } else {
      this.apiService.createUser(this.currentUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur création utilisateur:', err);
          alert('Erreur lors de la création de l\'utilisateur.');
        }
      });
    }
  }

  deleteUser(id: number, nom: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${nom}" ?`)) {
      this.apiService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur suppression utilisateur:', err);
          const msg = err.error?.message || err.message || 'Erreur lors de la suppression de l\'utilisateur.';
          alert(msg);
        }
      });
    }
  }

  toggleUserStatus(user: any): void {
    const nextStatus = !user.active;
    this.apiService.updateUser(user.id, { active: nextStatus }).subscribe({
      next: () => {
        user.active = nextStatus;
      },
      error: (err) => {
        console.error('Erreur mise à jour statut utilisateur:', err);
      }
    });
  }

  // ----- UI helpers -----
  getRoleLabel(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'Administrateur',
      LIBRARIAN: 'Bibliothécaire',
      STUDENT: 'Membre'
    };
    return map[role] || role;
  }

  getRoleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'badge-admin',
      LIBRARIAN: 'badge-librarian',
      STUDENT: 'badge-member'
    };
    return map[role] || 'badge-member';
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

  goToProfile(): void {
    this.router.navigate(['/admin/profile']);
  }

  getUserInitials(nom: string): string {
    if (!nom) return '?';
    const parts = nom.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nom.substring(0, 2).toUpperCase();
  }

  getUserColor(nom: string): string {
    const colors = ['#f59e0b','#3b82f6','#22c55e','#8b5cf6','#ec4899','#14b8a6','#ef4444','#0ea5e9'];
    let hash = 0;
    for (let i = 0; i < (nom || '').length; i++) {
      hash = nom.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}