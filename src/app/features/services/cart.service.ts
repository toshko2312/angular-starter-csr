import { computed, effect, Injectable, signal } from '@angular/core';
import { CartEntry, CartLine } from '@shared/models/cart.model';
import { EnquiryCartLine } from '@shared/models/enquiry.model';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { money } from '@shared/utils/money';

type CartState = Record<string, CartEntry>;

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly storageKey = 'cart';
  private readonly entries = signal<CartState>(this.restore());

  readonly lines = computed<CartLine[]>(() =>
    Object.values(this.entries()).map((entry) => ({
      ...entry,
      lineTotal: entry.item.price * entry.qty,
    }))
  );
  readonly count = computed(() =>
    this.lines().reduce((sum, line) => sum + line.qty, 0)
  );
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.lineTotal, 0)
  );
  readonly totalLabel = computed(() => money(this.total()));
  readonly isEmpty = computed(() => this.count() === 0);

  private readonly drawer = signal(false);
  readonly drawerOpen = this.drawer.asReadonly();

  constructor() {
    effect(() => this.persist(this.entries()));
  }

  qtyOf(id: string): number {
    return this.entries()[id]?.qty ?? 0;
  }

  add(item: MenuItemModel): void {
    this.step(item, 1);
  }

  increment(id: string): void {
    const entry = this.entries()[id];
    if (entry) this.step(entry.item, 1);
  }

  decrement(id: string): void {
    const entry = this.entries()[id];
    if (entry) this.step(entry.item, -1);
  }

  clear(): void {
    this.entries.set({});
  }

  toggleDrawer(): void {
    this.drawer.update((open) => !open);
  }

  closeDrawer(): void {
    this.drawer.set(false);
  }

  /** Snapshot of the cart in the shape stored on an enquiry row. */
  toEnquiryLines(): EnquiryCartLine[] {
    return this.lines().map((line) => ({
      id: line.item.id,
      name: line.item.name,
      qty: line.qty,
      price: line.item.price,
      unit: line.item.unit,
    }));
  }

  private step(item: MenuItemModel, delta: number): void {
    this.entries.update((state) => {
      const next = { ...state };
      const qty = (next[item.id]?.qty ?? 0) + delta;
      if (qty <= 0) {
        delete next[item.id];
      } else {
        next[item.id] = { item, qty };
      }
      return next;
    });
  }

  private restore(): CartState {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as CartState) : {};
    } catch {
      return {};
    }
  }

  private persist(state: CartState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // Storage unavailable (private mode, quota) — cart stays in memory only.
    }
  }
}
