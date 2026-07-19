import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getFirestore
} from 'firebase/firestore';

interface KycUser {
  uid: string;
  name: string;
  email: string;
  phone: string;
  kycStatus: string;
  documents: KycDocument[];
}

interface KycDocument {
  id: string;
  docType: string;
  filePath: string;
  downloadUrl: string;
  isVerified: boolean;
  uploadedAt: any;
}

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc.component.html',
  styleUrl: './kyc.component.scss'
})
export class KycComponent implements OnInit {
  private db = getFirestore();

  users = signal<KycUser[]>([]);
  loading = signal(true);
  processing = signal<string | null>(null);

  // Reject modal
  showRejectModal = signal(false);
  rejectTargetUid = signal('');
  rejectReason = signal('');

  // Document modal
  showDocModal = signal(false);
  docModalUser = signal<KycUser | null>(null);
  selectedDocUrl = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadPendingUsers();
  }

  async loadPendingUsers(): Promise<void> {
    this.loading.set(true);
    try {
      const usersSnap = await getDocs(
        query(collection(this.db, 'users'), where('kycStatus', '==', 'PENDING'))
      );

      const docsSnap = await getDocs(collection(this.db, 'documents'));
      const allDocs = docsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const result: KycUser[] = usersSnap.docs.map(u => {
        const data = u.data();
        const userDocs = allDocs.filter((d: any) => d.userId === u.id);
        return {
          uid: u.id,
          name: data['name'] ?? '',
          email: data['email'] ?? '',
          phone: data['phone'] ?? '',
          kycStatus: data['kycStatus'] ?? '',
          documents: userDocs
        };
      });

      this.users.set(result);
    } catch (err) {
      console.error('KYC load error', err);
    } finally {
      this.loading.set(false);
    }
  }

  async approveUser(uid: string): Promise<void> {
    this.processing.set(uid);
    try {
      // Update user status
      await updateDoc(doc(this.db, 'users', uid), {
        kycStatus: 'VERIFIED'
      });

      // Mark all their documents as verified
      const userDocsSnap = await getDocs(
        query(collection(this.db, 'documents'), where('userId', '==', uid))
      );
      await Promise.all(
        userDocsSnap.docs.map(d => updateDoc(doc(this.db, 'documents', d.id), { isVerified: true }))
      );

      // Remove from list
      this.users.update(list => list.filter(u => u.uid !== uid));
    } catch (err) {
      console.error('Approve error', err);
    } finally {
      this.processing.set(null);
    }
  }

  openRejectModal(uid: string): void {
    this.rejectTargetUid.set(uid);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.rejectTargetUid.set('');
    this.rejectReason.set('');
  }

  async confirmReject(): Promise<void> {
    if (!this.rejectReason().trim()) return;
    const uid = this.rejectTargetUid();
    this.processing.set(uid);
    try {
      await updateDoc(doc(this.db, 'users', uid), {
        kycStatus: 'REJECTED',
        kycRejectionReason: this.rejectReason().trim()
      });
      this.users.update(list => list.filter(u => u.uid !== uid));
      this.closeRejectModal();
    } catch (err) {
      console.error('Reject error', err);
    } finally {
      this.processing.set(null);
    }
  }

  openDocModal(user: KycUser): void {
    this.docModalUser.set(user);
    this.selectedDocUrl.set(user.documents[0]?.downloadUrl ?? null);
    this.showDocModal.set(true);
  }

  closeDocModal(): void {
    this.showDocModal.set(false);
    this.docModalUser.set(null);
    this.selectedDocUrl.set(null);
  }

  selectDoc(url: string): void {
    this.selectedDocUrl.set(url);
  }

  docTypeLabel(type: string): string {
    const map: Record<string, string> = {
      ID_CARD: 'Carte d\'identité',
      CONTRACT: 'Contrat',
      PASSPORT: 'Passeport'
    };
    return map[type] ?? type;
  }
}
