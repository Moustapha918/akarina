import { Routes } from '@angular/router';

export const investRoutes: Routes = [
  {
    path: ':projectId',
    loadComponent: () => import('./invest.component').then(m => m.InvestComponent),
  },
];
