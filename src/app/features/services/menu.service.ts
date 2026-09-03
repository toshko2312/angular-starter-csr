import { Injectable } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { catchError, from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly menuStorageKey = 'menu_items';

  getMenuItems(): Observable<MenuItemModel[]> {
    const cachedRaw = sessionStorage.getItem(this.menuStorageKey);

    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as MenuItemModel[];
      return of(cached);
    }

    return this.fetch();
  }

  /** Bypasses the cache — the admin panel always needs the live rows. */
  fetch(): Observable<MenuItemModel[]> {
    return from(supabase.from('menu_items').select().order('sort_order')).pipe(
      map((result) => {
        if (result.error) throw result.error;
        const items = (result.data || []) as MenuItemModel[];
        sessionStorage.setItem(this.menuStorageKey, JSON.stringify(items));
        return items;
      }),
      catchError((err) => {
        console.error('Error fetching menu items:', err);
        return of([]);
      })
    );
  }

  create(item: MenuItemModel): Observable<void> {
    return from(supabase.from('menu_items').insert(item)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  update(item: MenuItemModel): Observable<void> {
    return from(supabase.from('menu_items').update(item).eq('id', item.id)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  remove(id: string): Observable<void> {
    return from(supabase.from('menu_items').delete().eq('id', id)).pipe(
      map((result) => {
        if (result.error) throw result.error;
        this.clearCache();
      })
    );
  }

  /** Reads are cached per tab; without this an edit would serve stale rows. */
  private clearCache(): void {
    sessionStorage.removeItem(this.menuStorageKey);
  }
}
