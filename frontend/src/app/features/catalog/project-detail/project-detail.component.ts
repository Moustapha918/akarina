import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  readonly isLoggedIn = inject(AuthService).isLoggedIn;

  project = signal<Project | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.projectService.getProject(id).subscribe({
      next: (p) => { this.project.set(p); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/projects']); },
    });
  }

  invest(): void {
    if (!this.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.router.navigate(['/invest', this.project()!.id]);
  }
}
