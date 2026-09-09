import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection, getDocs, addDoc, updateDoc, doc,
  orderBy, query, where, serverTimestamp, getFirestore, Firestore
} from 'firebase/firestore';

export type ProjectType = 'CONSTRUCTION' | 'LAND_FLIP';
export type ExitStrategy = 'SALE' | 'RENTAL';
export type ProjectStatus = 'OPEN' | 'FUNDED' | 'CONSTRUCTION' | 'RENTING' | 'COMPLETED';

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  roiEstimate: number;
  roiDurationMonths: number;
  status: ProjectStatus;
  projectType: ProjectType;
  exitStrategy?: ExitStrategy;
  monthlyRent?: number;
  expectedSalePrice?: number;
  coverImageUrl?: string;
  maxInvestors: number;
  currentInvestors: number;
  minInvestment: number;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Calcule à la volée le montant collecté et le nombre d'investisseurs distincts
 * d'un projet, depuis les investissements SUCCESS — `collectedAmount`/
 * `currentInvestors` stockés sur le document projet ne sont pas fiables (rien
 * ne les maintient en écriture, voir mobile/src/services/projectService.ts).
 */
async function getProjectFundingStats(
  db: Firestore,
  projectId: string
): Promise<{ collectedAmount: number; currentInvestors: number }> {
  const snap = await getDocs(
    query(
      collection(db, 'investments'),
      where('projectId', '==', projectId),
      where('status', '==', 'SUCCESS')
    )
  );

  let collectedAmount = 0;
  const investorIds = new Set<string>();
  snap.docs.forEach((d) => {
    const data = d.data() as { amount?: number; userId?: string };
    collectedAmount += data.amount ?? 0;
    if (data.userId) investorIds.add(data.userId);
  });

  return { collectedAmount, currentInvestors: investorIds.size };
}

function statusFlow(p: Project): ProjectStatus[] {
  if (p.projectType === 'LAND_FLIP') return ['OPEN', 'FUNDED', 'COMPLETED'];
  if (p.exitStrategy === 'RENTAL') return ['OPEN', 'FUNDED', 'CONSTRUCTION', 'RENTING', 'COMPLETED'];
  return ['OPEN', 'FUNDED', 'CONSTRUCTION', 'COMPLETED'];
}

const BLANK_FORM = () => ({
  title: '',
  description: '',
  location: '',
  targetAmount: 0,
  roiEstimate: 0,
  roiDurationMonths: 12,
  status: 'OPEN' as ProjectStatus,
  projectType: 'CONSTRUCTION' as ProjectType,
  exitStrategy: 'SALE' as ExitStrategy,
  monthlyRent: undefined as number | undefined,
  expectedSalePrice: undefined as number | undefined,
  coverImageUrl: '',
  maxInvestors: 200,
  minInvestment: 5000
});

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  private db = getFirestore();

  projects = signal<Project[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);

  showModal = signal(false);
  formData = signal(BLANK_FORM());
  saving = signal(false);
  formError = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const snap = await getDocs(
        query(collection(this.db, 'projects'), orderBy('createdAt', 'desc'))
      );
      const projects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      const withStats = await Promise.all(
        projects.map(async (p) => ({ ...p, ...(await getProjectFundingStats(this.db, p.id)) }))
      );
      this.projects.set(withStats);
    } catch (err) {
      console.error('Projects load error', err);
    } finally {
      this.loading.set(false);
    }
  }

  progress(p: Project): number {
    if (!p.targetAmount) return 0;
    return Math.min(100, Math.round((p.collectedAmount / p.targetAmount) * 100));
  }

  nextStatus(project: Project): ProjectStatus | null {
    const flow = statusFlow(project);
    const idx = flow.indexOf(project.status);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Ouvert', FUNDED: 'Financé', CONSTRUCTION: 'Construction',
      RENTING: 'En location', COMPLETED: 'Terminé'
    };
    return map[status] ?? status;
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'badge-success', FUNDED: 'badge-primary',
      CONSTRUCTION: 'badge-warning', RENTING: 'badge-purple',
      COMPLETED: 'badge-secondary'
    };
    return map[status] ?? 'badge-secondary';
  }

  projectTypeLabel(type: ProjectType): string {
    return type === 'CONSTRUCTION' ? '🏗️ Construction' : '🏕️ Achat-Revente Terrain';
  }

  isConstruction(f: ReturnType<typeof BLANK_FORM>): boolean {
    return f.projectType === 'CONSTRUCTION';
  }

  isRental(f: ReturnType<typeof BLANK_FORM>): boolean {
    return f.projectType === 'CONSTRUCTION' && f.exitStrategy === 'RENTAL';
  }

  async advanceStatus(project: Project): Promise<void> {
    const next = this.nextStatus(project);
    if (!next) return;
    this.processing.set(project.id);
    try {
      await updateDoc(doc(this.db, 'projects', project.id), {
        status: next, updatedAt: serverTimestamp()
      });
      this.projects.update(list =>
        list.map(p => p.id === project.id ? { ...p, status: next } : p)
      );
    } catch (err) {
      console.error('Status update error', err);
    } finally {
      this.processing.set(null);
    }
  }

  openModal(): void {
    this.formData.set(BLANK_FORM());
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  updateForm(field: string, value: any): void {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  async saveProject(): Promise<void> {
    const f = this.formData();
    if (!f.title.trim() || !f.location.trim() || !f.targetAmount) {
      this.formError.set('Titre, localisation et montant cible sont obligatoires.');
      return;
    }
    if (f.projectType === 'CONSTRUCTION' && f.exitStrategy === 'RENTAL' && !f.monthlyRent) {
      this.formError.set('Le loyer mensuel est obligatoire pour un projet en location.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    try {
      const payload: any = {
        title: f.title.trim(),
        description: f.description.trim(),
        location: f.location.trim(),
        targetAmount: Number(f.targetAmount),
        roiEstimate: Number(f.roiEstimate),
        roiDurationMonths: Number(f.roiDurationMonths),
        maxInvestors: Number(f.maxInvestors),
        minInvestment: Number(f.minInvestment),
        coverImageUrl: f.coverImageUrl ?? '',
        status: 'OPEN',
        projectType: f.projectType,
        collectedAmount: 0,
        currentInvestors: 0,
        imageUrls: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (f.projectType === 'CONSTRUCTION') {
        payload.exitStrategy = f.exitStrategy;
        if (f.exitStrategy === 'RENTAL' && f.monthlyRent) {
          payload.monthlyRent = Number(f.monthlyRent);
        }
      }
      if (f.expectedSalePrice) payload.expectedSalePrice = Number(f.expectedSalePrice);

      const docRef = await addDoc(collection(this.db, 'projects'), payload);
      this.projects.update(list => [{ id: docRef.id, ...payload } as Project, ...list]);
      this.closeModal();
    } catch (err) {
      console.error('Save project error', err);
      this.formError.set('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-MR', { maximumFractionDigits: 0 }).format(n ?? 0);
  }
}
