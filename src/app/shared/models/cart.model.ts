import { MenuItemModel } from './menu-item.model';

export interface CartEntry {
  item: MenuItemModel;
  qty: number;
}

export interface CartLine extends CartEntry {
  lineTotal: number;
}
