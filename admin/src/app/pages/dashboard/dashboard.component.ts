import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  collection,
  getDocs,
  query,
  where,
  getFirestore
} from 'firebase/firestore';

interface DashboardStats {
  kycPending: number;
  totalInvestments: number;
  totalCollected: number;
  openProjects: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private db = getFirestore();

  stats = signal<DashboardStats>({
    kycPending: 0,
    totalInvestments: 0,
    totalCollected: 0,
    openProjects: 0
  });

  loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const [kycSnap, investSnap, successInvestSnap, openProjectsSnap] = await Promise.all([
        getDocs(query(collection(this.db, 'users'), where('kycStatus', '==', 'PENDING'))),
        getDocs(collection(this.db, 'investments')),
        getDocs(query(collection(this.db, 'investments'), where('status', '==', 'SUCCESS'))),
        getDocs(query(collection(this.db, 'projects'), where('status', '==', 'OPEN')))
      ]);

      const totalCollected = successInvestSnap.docs.reduce(
        (sum, d) => sum + (d.data()['amount'] ?? 0), 0
      );

      this.stats.set({
        kycPending: kycSnap.size,
        totalInvestments: investSnap.size,
        totalCollected,
        openProjects: openProjectsSnap.size
      });
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      this.loading.set(false);
    }
  }

  formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-MR', { maximumFractionDigits: 0 }).format(n) + ' MRU';
  }
}
