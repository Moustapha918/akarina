import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectPage, ProjectStatus } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly base = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  listProjects(page = 0, size = 12, status?: ProjectStatus): Observable<ProjectPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<ProjectPage>(this.base, { params });
  }

  searchProjects(query: string, page = 0): Observable<ProjectPage> {
    const params = new HttpParams().set('q', query).set('page', page);
    return this.http.get<ProjectPage>(`${this.base}/search`, { params });
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  // Admin operations
  createProject(payload: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.base, payload);
  }

  updateProject(id: number, payload: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, payload);
  }

  updateStatus(id: number, status: ProjectStatus): Observable<Project> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<Project>(`${this.base}/${id}/status`, null, { params });
  }
}
