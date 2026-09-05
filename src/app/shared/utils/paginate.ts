/** Rows per page across the admin lists. */
export const ADMIN_PAGE_SIZE = 10;

/** The rows belonging to a 1-based page. */
export function pageSlice<T>(rows: T[], page: number, size = ADMIN_PAGE_SIZE): T[] {
  const start = (Math.max(1, page) - 1) * size;
  return rows.slice(start, start + size);
}

/** How many pages the rows fill. Never below 1, so an empty list still reads "1". */
export function pageCount(total: number, size = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/**
 * Keeps a page number inside a list that may have shrunk — deleting the last
 * row of the last page would otherwise leave the view on an empty page.
 */
export function clampPage(page: number, total: number, size = ADMIN_PAGE_SIZE): number {
  return Math.min(Math.max(1, page), pageCount(total, size));
}
