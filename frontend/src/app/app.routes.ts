import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'projects',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/catalog/catalog.routes').then(m => m.catalogRoutes),
  },
  {
    path: 'invest',
    loadChildren: () => import('./features/invest/invest.routes').then(m => m.investRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'kyc',
    loadChildren: () => import('./features/kyc/kyc.routes').then(m => m.kycRoutes),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'projects',
  },
];
