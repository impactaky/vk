/**
 * Apply filters to an array of items
 * @param items - Array of items to filter
 * @param filters - Object containing filter key-value pairs
 * @returns Filtered array of items
 */
// deno-lint-ignore no-explicit-any
export function applyFilters<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, unknown>,
): T[] {
  if (Object.keys(filters).length === 0) {
    return items;
  }

  return items.filter((item) => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (filterValue === undefined || filterValue === null) {
        return true;
      }

      const itemValue = item[key];

      if (Array.isArray(itemValue)) {
        return itemValue.includes(filterValue);
      }

      return itemValue === filterValue;
    });
  });
}
