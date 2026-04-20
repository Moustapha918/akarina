import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private projectService = inject(ProjectService);

  stats = signal<Record<string, number> | null>(null);
  projects = signal<Project[]>([]);
  pendingKycCount = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    this.http.get<Record<string, number>>(`${environment.apiUrl}/dashboard/admin/stats`).subscribe(s => {
      this.stats.set(s);
      this.pendingKycCount.set(s['pendingKycValidations'] ?? 0);
    });

    this.projectService.listProjects(0, 50).subscribe(page => {
      this.projects.set(page.content);
      this.loading.set(false);
    });
  }

  updateStatus(project: Project, status: string): void {
    this.projectService.updateStatus(project.id, status as any).subscribe(updated => {
      this.projects.update(list => list.map(p => p.id === updated.id ? updated : p));
    });
  }
}
