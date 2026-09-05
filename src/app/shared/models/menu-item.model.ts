export interface MenuItemModel {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  image_path: string | null;
  /** Optional English text; blank falls back to the Bulgarian above. */
  name_en?: string | null;
  description_en?: string | null;
}
