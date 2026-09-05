import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { MenuCategoryModel } from '@shared/models/menu-category.model';
import { catchError, from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  /** sessionStorage does not exist while prerendering in Node. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly storageKey = 'menu_categories';

  getCategories(): Observable<MenuCategoryModel[]> {
    const cachedRaw = this.isBrowser && sessionStorage.getItem(this.storageKey);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as MenuCategoryModel[];
      return of(cached);
    }

    return this.fetch();
  }

  /** Bypasses the cache — the admin panel always needs the live rows. */
  fetch(): Observable<MenuCategoryModel[]> {
    return from(
      supabase.from('menu_categories').select().order('sort_order').order('name')
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        const categories = (result.data || []) as MenuCategoryModel[];
        if (this.isBrowser) sessionStorage.setItem(this.storageKey, JSON.stringify(categories));
        return categories;
      }),
      catchError((err) => {
        console.error('Error fetching menu categories:', err);
        return of([]);
      })
    );
  }

  create(category: Omit<MenuCategoryModel, 'id'>): Observable<void> {
    return from(supabase.from('menu_categories').insert(category)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  /**
   * A rename cascades to menu_items.category through the
   * menu_categories_rename trigger, so the menu cache is dropped too.
   */
  update(category: MenuCategoryModel): Observable<void> {
    return from(
      supabase
        .from('menu_categories')
        .update({
          name: category.name,
          name_en: category.name_en ?? null,
          sort_order: category.sort_order,
        })
        .eq('id', category.id)
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
        // The rename cascaded to menu_items.category, so that cache is stale too.
        if (this.isBrowser) sessionStorage.removeItem('menu_items');
      })
    );
  }

  remove(id: string): Observable<void> {
    return from(supabase.from('menu_categories').delete().eq('id', id)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  /** How many menu items still sit in this category; blocks a delete. */
  countItems(name: string): Observable<number> {
    return from(
      supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('category', name)
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return result.count ?? 0;
      })
    );
  }

  /** Reads are cached per tab; without this an edit would serve stale rows. */
  private clearCache(): void {
    if (!this.isBrowser) return;
    sessionStorage.removeItem(this.storageKey);
  }
}
