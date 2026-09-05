export interface MenuCategoryModel {
  id: string;
  name: string;
  sort_order: number;
  /** Optional English name; blank falls back to `name`. */
  name_en?: string | null;
}
