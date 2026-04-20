import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a routerLink="/" class="text-2xl font-bold text-primary-700">Akarina</a>
        <div class="flex items-center gap-4 text-sm">
          <a routerLink="/projects" class="text-gray-600 hover:text-primary-700 font-medium">Projets</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/dashboard" class="text-gray-600 hover:text-primary-700 font-medium">Portefeuille</a>
            @if (auth.isAdmin()) {
              <a routerLink="/dashboard/admin" class="text-gray-600 hover:text-primary-700 font-medium">Admin</a>
            }
            <a routerLink="/kyc" class="text-gray-600 hover:text-primary-700 font-medium">KYC</a>
            <button (click)="auth.logout()"
              class="text-red-500 hover:text-red-700 font-medium">Déconnexion</button>
          } @else {
            <a routerLink="/auth/login"
              class="bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition font-medium">
              Connexion
            </a>
          }
        </div>
      </div>
    </nav>
    <router-outlet />
  `,
})
export class AppComponent {
  auth = inject(AuthService);
}
