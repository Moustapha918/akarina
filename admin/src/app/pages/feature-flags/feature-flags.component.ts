import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getFunctions, httpsCallable } from 'firebase/functions';

const FLAG_PREFIX = 'feature_';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
}

@Component({
  selector: 'app-feature-flags',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feature-flags.component.html',
  styleUrl: './feature-flags.component.scss'
})
export class FeatureFlagsComponent implements OnInit {
  // Les Cloud Functions sont déployées en europe-west1 (voir functions/src/*) —
  // le SDK cible us-central1 par défaut, la région doit donc être explicite.
  private functions = getFunctions(undefined, 'europe-west1');

  flags = signal<FeatureFlag[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);
  error = signal('');

  showModal = signal(false);
  newKey = signal('');
  newDescription = signal('');
  saving = signal(false);
  formError = signal('');

  async ngOnInit(): Promise<void> {
    await this.loadFlags();
  }

  async loadFlags(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const list = httpsCallable<void, { flags: FeatureFlag[] }>(this.functions, 'listFeatureFlags');
      const { data } = await list();
      this.flags.set(data.flags);
    } catch (err) {
      console.error('List feature flags error', err);
      this.error.set('Impossible de charger les feature flags.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(flag: FeatureFlag): Promise<void> {
    this.processing.set(flag.key);
    try {
      const set = httpsCallable<{ key: string; enabled: boolean; description?: string }, { success: true }>(
        this.functions, 'setFeatureFlag'
      );
      await set({ key: flag.key, enabled: !flag.enabled, description: flag.description });
      this.flags.update(list =>
        list.map(f => f.key === flag.key ? { ...f, enabled: !f.enabled } : f)
      );
    } catch (err) {
      console.error('Set feature flag error', err);
      this.error.set(`Impossible de basculer "${flag.key}".`);
    } finally {
      this.processing.set(null);
    }
  }

  openModal(): void {
    this.newKey.set('');
    this.newDescription.set('');
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async createFlag(): Promise<void> {
    const rawKey = this.newKey().trim();
    if (!rawKey) {
      this.formError.set('Le nom du flag est obligatoire.');
      return;
    }
    const key = rawKey.startsWith(FLAG_PREFIX) ? rawKey : `${FLAG_PREFIX}${rawKey}`;
    if (this.flags().some(f => f.key === key)) {
      this.formError.set('Ce flag existe déjà.');
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    try {
      const set = httpsCallable<{ key: string; enabled: boolean; description?: string }, { success: true }>(
        this.functions, 'setFeatureFlag'
      );
      await set({ key, enabled: false, description: this.newDescription().trim() });
      this.flags.update(list => [...list, { key, enabled: false, description: this.newDescription().trim() }]);
      this.closeModal();
    } catch (err) {
      console.error('Create feature flag error', err);
      this.formError.set('Erreur lors de la création. Réessayez.');
    } finally {
      this.saving.set(false);
    }
  }

  displayName(key: string): string {
    return key.startsWith(FLAG_PREFIX) ? key.slice(FLAG_PREFIX.length) : key;
  }
}
