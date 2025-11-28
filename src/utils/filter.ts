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
  // If no filters are provided, return all items
  if (Object.keys(filters).length === 0) {
    return items;
  }

  return items.filter((item) => {
    // Check if item matches all filter conditions (AND logic)
    return Object.entries(filters).every(([key, filterValue]) => {
      const itemValue = item[key];

      // Handle undefined/null filter values (skip filtering for this field)
      if (filterValue === undefined || filterValue === null) {
        return true;
      }

      // Handle array fields - match if any element equals the filter value
      if (Array.isArray(itemValue)) {
        return itemValue.some((element) => element === filterValue);
      }

      // Handle boolean comparison
      if (typeof filterValue === "boolean") {
        return itemValue === filterValue;
      }

      // Handle numeric comparison
      if (typeof filterValue === "number") {
        return itemValue === filterValue;
      }

      // Handle string comparison (case-sensitive)
      if (typeof filterValue === "string") {
        return itemValue === filterValue;
      }

      // Default: exact equality check
      return itemValue === filterValue;
    });
  });
}
