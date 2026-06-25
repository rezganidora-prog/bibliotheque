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
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },

  { path: 'admin/livres', component: AdminLivresComponent, canActivate: [adminGuard] },
  { path: 'admin/utilisateurs', component: AdminUtilisateursComponent, canActivate: [adminGuard] },
  { path: 'admin/emprunts', component: AdminEmpruntsComponent, canActivate: [adminGuard] },
  { path: 'admin/reservations', component: AdminReservationsComponent, canActivate: [adminGuard] },

  { path: 'profile', component: StudentProfileComponent, canActivate: [authGuard] },
  { path: 'admin/profile', component: AdminProfileComponent, canActivate: [adminGuard] },

  { path: '**', redirectTo: 'login' }
];