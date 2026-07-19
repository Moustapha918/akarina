import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  collection,
  getDocs,
  query,
  orderBy,
  getDoc,
  doc,
  getFirestore
} from 'firebase/firestore';

interface Investment {
  id: string;
  userId: string;
  projectId: string;
  amount: number;
  bankilyRef?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  contractUrl?: string;
  createdAt?: any;
  // enriched
  userName?: string;
  projectTitle?: string;
}

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.scss'
})
export class InvestmentsComponent implements OnInit {
  private db = getFirestore();

  investments = signal<Investment[]>([]);
  loading = signal(true);

  // Computed summaries
  successCount = computed(() =>
    this.investments().filter(i => i.status === 'SUCCESS').length
  );
  totalCollected = computed(() =>
    this.investments()
      .filter(i => i.status === 'SUCCESS')
      .reduce((sum, i) => sum + (i.amount ?? 0), 0)
  );

  async ngOnInit(): Promise<void> {
    await this.loadInvestments();
  }

  async loadInvestments(): Promise<void> {
    this.loading.set(true);
    try {
      const snap = await getDocs(
        query(collection(this.db, 'investments'), orderBy('createdAt', 'desc'))
      );

      // Collect unique user and project IDs for batch lookup
      const userIds = new Set<string>();
      const projectIds = new Set<string>();
      const raw: Investment[] = snap.docs.map(d => {
        const data = d.data();
        userIds.add(data['userId'] ?? '');
        projectIds.add(data['projectId'] ?? '');
        return { id: d.id, ...data } as Investment;
      });

      // Batch fetch user names
      const userNames = new Map<string, string>();
      await Promise.all([...userIds].filter(Boolean).map(async uid => {
        try {
          const uDoc = await getDoc(doc(this.db, 'users', uid));
          if (uDoc.exists()) {
            userNames.set(uid, uDoc.data()['name'] ?? uid);
          }
        } catch {}
      }));

      // Batch fetch project titles
      const projectTitles = new Map<string, string>();
      await Promise.all([...projectIds].filter(Boolean).map(async pid => {
        try {
          const pDoc = await getDoc(doc(this.db, 'projects', pid));
          if (pDoc.exists()) {
            projectTitles.set(pid, pDoc.data()['title'] ?? pid);
          }
        } catch {}
      }));

      this.investments.set(raw.map(i => ({
        ...i,
        userName: userNames.get(i.userId) ?? i.userId,
        projectTitle: projectTitles.get(i.projectId) ?? i.projectId
      })));
    } catch (err) {
      console.error('Investments load error', err);
    } finally {
      this.loading.set(false);
    }
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      SUCCESS: 'badge-success',
      PENDING: 'badge-warning',
      FAILED:  'badge-danger'
    };
    return map[status] ?? 'badge-secondary';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      SUCCESS: 'Succès',
      PENDING: 'En attente',
      FAILED:  'Échoué'
    };
    return map[status] ?? status;
  }

  formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-MR', { maximumFractionDigits: 0 }).format(n) + ' MRU';
  }

  formatDate(ts: any): string {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
