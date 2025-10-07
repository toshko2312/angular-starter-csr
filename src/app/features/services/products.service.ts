import { Injectable } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { ProjectModel } from '@shared/models/project.model';
import { catchError, from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly projectsStorageKey = 'projects';
  constructor() {}

  getProjects(): Observable<ProjectModel[]> {
    const cachedRaw = sessionStorage.getItem(this.projectsStorageKey);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as ProjectModel[];
      return of(cached);
    }

    return from(supabase.from('projects').select()).pipe(
      map((result) => {
        if (result.error) throw result.error;
        sessionStorage.setItem(this.projectsStorageKey, JSON.stringify(result.data));
        return result.data || [];
      }),
      catchError((err) => {
        console.error('Error fetching projects:', err);
        return [[]]; // fallback to empty array
      })
    );
  }
}
