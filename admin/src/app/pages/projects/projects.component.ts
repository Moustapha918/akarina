import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  getFirestore
} from 'firebase/firestore';

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  roiEstimate: number;
  roiDurationMonths: number;
  status: 'OPEN' | 'FUNDED' | 'CONSTRUCTION' | 'COMPLETED';
  coverImageUrl?: string;
  maxInvestors: number;
  currentInvestors: number;
  minInvestment: number;
  createdAt?: any;
  updatedAt?: any;
}

const STATUS_ORDER: Project['status'][] = ['OPEN', 'FUNDED', 'CONSTRUCTION', 'COMPLETED'];

const BLANK_FORM = (): Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'collectedAmount' | 'currentInvestors'> => ({
  title: '',
  description: '',
  location: '',
  targetAmount: 0,
  roiEstimate: 0,
  roiDurationMonths: 12,
  status: 'OPEN',
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
      this.projects.set(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Project))
      );
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

  nextStatus(status: Project['status']): Project['status'] | null {
    const idx = STATUS_ORDER.indexOf(status);
    return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'Ouvert',
      FUNDED: 'Financé',
      CONSTRUCTION: 'Construction',
      COMPLETED: 'Terminé'
    };
    return map[status] ?? status;
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'badge-success',
      FUNDED: 'badge-primary',
      CONSTRUCTION: 'badge-warning',
      COMPLETED: 'badge-secondary'
    };
    return map[status] ?? 'badge-secondary';
  }

  async advanceStatus(project: Project): Promise<void> {
    const next = this.nextStatus(project.status);
    if (!next) return;
    this.processing.set(project.id);
    try {
      await updateDoc(doc(this.db, 'projects', project.id), {
        status: next,
        updatedAt: serverTimestamp()
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

  closeModal(): void {
    this.showModal.set(false);
  }

  updateForm(field: string, value: any): void {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  async saveProject(): Promise<void> {
    const f = this.formData();
    if (!f.title.trim() || !f.location.trim() || !f.targetAmount) {
      this.formError.set('Titre, localisation et montant cible sont obligatoires.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    try {
      const docRef = await addDoc(collection(this.db, 'projects'), {
        ...f,
        collectedAmount: 0,
        currentInvestors: 0,
        targetAmount: Number(f.targetAmount),
        roiEstimate: Number(f.roiEstimate),
        roiDurationMonths: Number(f.roiDurationMonths),
        maxInvestors: Number(f.maxInvestors),
        minInvestment: Number(f.minInvestment),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      this.projects.update(list => [{
        id: docRef.id,
        ...f,
        collectedAmount: 0,
        currentInvestors: 0
      } as Project, ...list]);
      this.closeModal();
    } catch (err) {
      console.error('Save project error', err);
      this.formError.set('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-MR', { maximumFractionDigits: 0 }).format(n);
  }
}
