import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

type DocType = 'ID_CARD' | 'PASSPORT';

@Component({
  selector: 'app-kyc-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './kyc-upload.component.html',
})
export class KycUploadComponent {
  private http = inject(HttpClient);

  selectedDocType = signal<DocType>('ID_CARD');
  selectedFile = signal<File | null>(null);
  uploading = signal(false);
  success = signal(false);
  error = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.error.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    const formData = new FormData();
    formData.append('docType', this.selectedDocType());
    formData.append('file', file);

    this.uploading.set(true);
    this.error.set(null);

    this.http.post(`${environment.apiUrl}/kyc/upload`, formData).subscribe({
      next: () => {
        this.uploading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err.error?.detail ?? 'Erreur lors de l\'upload. Vérifiez le format et la taille du fichier.');
      },
    });
  }
}
