import { Injectable } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { ProjectModel } from '@shared/models/project.model';
import { catchError, from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly projectsStorageKey = 'projects';

  getProjects(): Observable<ProjectModel[]> {
    const cachedRaw = sessionStorage.getItem(this.projectsStorageKey);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as ProjectModel[];
      return of(cached);
    }

    return this.fetch();
  }

  /** Bypasses the cache — the admin panel always needs the live rows. */
  fetch(): Observable<ProjectModel[]> {
    return from(supabase.from('projects').select()).pipe(
      map((result) => {
        if (result.error) throw result.error;
        const projects = (result.data || []) as ProjectModel[];
        sessionStorage.setItem(this.projectsStorageKey, JSON.stringify(projects));
        return projects;
      }),
      catchError((err) => {
        console.error('Error fetching projects:', err);
        return of([]);
      })
    );
  }

  create(project: Omit<ProjectModel, 'id'>): Observable<void> {
    return from(supabase.from('projects').insert(project)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  update(project: ProjectModel): Observable<void> {
    return from(supabase.from('projects').update(project).eq('id', project.id)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  remove(id: number): Observable<void> {
    return from(supabase.from('projects').delete().eq('id', id)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  /** Reads are cached per tab; without this an edit would serve stale rows. */
  private clearCache(): void {
    sessionStorage.removeItem(this.projectsStorageKey);
  }
}
