import { Routes } from '@angular/router';

export const kycRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./kyc-upload.component').then(m => m.KycUploadComponent),
  },
];
