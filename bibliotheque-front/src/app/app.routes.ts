import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AdminDashboardComponent } from './components/admin/admin-dashboard';
import { StudentProfileComponent } from './components/student-profile/student-profile';
import { AdminProfileComponent } from './components/admin-profile/admin-profile';
import { AdminLivresComponent } from './components/admin-livres/admin-livres.component';
import { AdminUtilisateursComponent } from './components/admin-utilisateurs/admin-utilisateurs.component';
import { AdminEmpruntsComponent } from './components/admin-emprunt/admin-emprunt.component';
import { AdminReservationsComponent } from './components/admin-reservations/admin-reservations.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },

  { path: 'admin/livres', component: AdminLivresComponent },
  { path: 'admin/utilisateurs', component: AdminUtilisateursComponent },
  { path: 'admin/emprunts', component: AdminEmpruntsComponent },
  { path: 'admin/reservations', component: AdminReservationsComponent },

  { path: 'profile', component: StudentProfileComponent },
  { path: 'admin/profile', component: AdminProfileComponent },

  { path: '**', redirectTo: 'login' }
];