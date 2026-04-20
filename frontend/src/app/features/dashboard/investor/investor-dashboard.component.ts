import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvestmentService } from '../../../core/services/investment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Portfolio } from '../../../core/models/investment.model';

@Component({
  selector: 'app-investor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './investor-dashboard.component.html',
})
export class InvestorDashboardComponent implements OnInit {
  private investmentService = inject(InvestmentService);
  readonly currentUser = inject(AuthService).currentUser;

  portfolio = signal<Portfolio | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.investmentService.getPortfolio().subscribe({
      next: (p) => { this.portfolio.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      SUCCESS: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      FAILED: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-gray-100 text-gray-600',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }
}
