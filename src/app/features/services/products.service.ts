import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { ProjectModel } from '@shared/models/project.model';
import { catchError, from, map, Observable, of } from 'rxjs';
import { untilStable } from '@shared/utils/until-stable';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  /** sessionStorage does not exist while prerendering in Node. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly projectsStorageKey = 'projects';
  /** Blocks prerender stability until the rows land. See untilStable(). */
  private readonly blockStability = untilStable<ProjectModel[]>();

  getProjects(): Observable<ProjectModel[]> {
    const cachedRaw = this.isBrowser && sessionStorage.getItem(this.projectsStorageKey);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as ProjectModel[];
      return of(newestFirst(cached));
    }

    return this.fetch();
  }

  /** Bypasses the cache — the admin panel always needs the live rows. */
  fetch(): Observable<ProjectModel[]> {
    // Newest event first. nullsFirst: false because `date` is nullable and
    // Postgres sorts nulls first in a descending order — an undated event
    // would otherwise open the landing page.
    return from(
      supabase.from('projects').select().order('date', { ascending: false, nullsFirst: false })
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        const projects = newestFirst((result.data || []) as ProjectModel[]);
        if (this.isBrowser) sessionStorage.setItem(this.projectsStorageKey, JSON.stringify(projects));
        return projects;
      }),
      catchError((err) => {
        console.error('Error fetching projects:', err);
        return of([]);
      })
    ).pipe(this.blockStability);
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
    if (!this.isBrowser) return;
    sessionStorage.removeItem(this.projectsStorageKey);
  }
}

/**
 * Newest event first, undated ones last.
 *
 * The query orders too, but a tab that cached the rows before this existed
 * keeps that array for the life of the tab — sessionStorage survives reloads —
 * so the order has to hold whichever path the rows arrived by.
 */
function newestFirst(projects: ProjectModel[]): ProjectModel[] {
  return [...projects].sort((a, b) => time(b.date) - time(a.date));
}

/** Missing or unparseable dates sort to the end. */
function time(date: Date | string | null | undefined): number {
  if (!date) return -Infinity;
  const parsed = new Date(date).getTime();
  return isNaN(parsed) ? -Infinity : parsed;
}
