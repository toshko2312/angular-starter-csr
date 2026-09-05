import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { supabase } from '@core/configs/supabase.client';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { catchError, from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  /** sessionStorage does not exist while prerendering in Node. */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly menuStorageKey = 'menu_items';

  getMenuItems(): Observable<MenuItemModel[]> {
    const cachedRaw = this.isBrowser && sessionStorage.getItem(this.menuStorageKey);

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
        if (this.isBrowser) sessionStorage.setItem(this.menuStorageKey, JSON.stringify(items));
        return items;
      }),
      catchError((err) => {
        console.error('Error fetching menu items:', err);
        return of([]);
      })
    );
  }

  /** The id is minted by the database, so a new row does not carry one. */
  create(item: Omit<MenuItemModel, 'id'>): Observable<void> {
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
    if (!this.isBrowser) return;
    sessionStorage.removeItem(this.menuStorageKey);
  }
}
