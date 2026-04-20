import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { Project, ProjectStatus } from '../../core/models/project.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit {
  private projectService = inject(ProjectService);

  projects = signal<Project[]>([]);
  loading = signal(true);
  totalPages = signal(0);
  currentPage = signal(0);
  searchQuery = signal('');
  selectedStatus = signal<ProjectStatus | undefined>(undefined);

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.listProjects(this.currentPage(), 12, this.selectedStatus()).subscribe({
      next: (page) => {
        this.projects.set(page.content);
        this.totalPages.set(page.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    if (!this.searchQuery().trim()) { this.loadProjects(); return; }
    this.loading.set(true);
    this.projectService.searchProjects(this.searchQuery()).subscribe({
      next: (page) => {
        this.projects.set(page.content);
        this.loading.set(false);
      },
    });
  }

  onStatusFilter(status: string): void {
    this.selectedStatus.set((status as ProjectStatus) || undefined);
    this.currentPage.set(0);
    this.loadProjects();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProjects();
  }

  getStatusLabel(status: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      OPEN: 'Ouvert', FUNDED: 'Financé', CONSTRUCTION: 'En construction',
      COMPLETED: 'Terminé', CANCELLED: 'Annulé',
    };
    return labels[status];
  }

  getStatusColor(status: ProjectStatus): string {
    const colors: Record<ProjectStatus, string> = {
      OPEN: 'bg-green-100 text-green-700',
      FUNDED: 'bg-blue-100 text-blue-700',
      CONSTRUCTION: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status];
  }
}
