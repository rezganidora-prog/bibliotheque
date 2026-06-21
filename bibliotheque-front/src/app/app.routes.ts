import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AdminDashboardComponent } from './components/admin/admin-dashboard';
import { StudentProfileComponent } from './components/student-profile/student-profile';
import { AdminProfileComponent } from './components/admin-profile/admin-profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },

  { path: 'profile', component: StudentProfileComponent },
  { path: 'admin/profile', component: AdminProfileComponent },

  { path: '**', redirectTo: 'login' }
];
// Force rebuild comment