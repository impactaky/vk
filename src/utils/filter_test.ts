import { assertEquals } from "@std/assert";
import { applyFilters } from "./filter.ts";

Deno.test("applyFilters - no filters returns all items", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const result = applyFilters(items, {});
  assertEquals(result, items);
});

Deno.test("applyFilters - string filter matches exactly", () => {
  const items = [
    { id: "1", name: "Frontend" },
    { id: "2", name: "Backend" },
    { id: "3", name: "frontend" }, // Different case
  ];

  const result = applyFilters(items, { name: "Frontend" });
  assertEquals(result, [{ id: "1", name: "Frontend" }]);
});

Deno.test("applyFilters - boolean filter", () => {
  const items = [
    { id: "1", archived: true },
    { id: "2", archived: false },
    { id: "3", archived: true },
  ];

  const result = applyFilters(items, { archived: false });
  assertEquals(result, [{ id: "2", archived: false }]);
});

Deno.test("applyFilters - numeric filter", () => {
  const items = [
    { id: "1", priority: 5 },
    { id: "2", priority: 3 },
    { id: "3", priority: 5 },
  ];

  const result = applyFilters(items, { priority: 5 });
  assertEquals(result, [
    { id: "1", priority: 5 },
    { id: "3", priority: 5 },
  ]);
});

Deno.test("applyFilters - array field matching", () => {
  const items = [
    { id: "1", labels: ["bug", "urgent"] },
    { id: "2", labels: ["feature"] },
    { id: "3", labels: ["bug", "low-priority"] },
  ];

  const result = applyFilters(items, { labels: "bug" });
  assertEquals(result, [
    { id: "1", labels: ["bug", "urgent"] },
    { id: "3", labels: ["bug", "low-priority"] },
  ]);
});

Deno.test("applyFilters - multiple filters (AND logic)", () => {
  const items = [
    { id: "1", status: "completed", priority: 5 },
    { id: "2", status: "in_progress", priority: 5 },
    { id: "3", status: "completed", priority: 3 },
  ];

  const result = applyFilters(items, { status: "completed", priority: 5 });
  assertEquals(result, [{ id: "1", status: "completed", priority: 5 }]);
});

Deno.test("applyFilters - no matches returns empty array", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const result = applyFilters(items, { name: "NonExistent" });
  assertEquals(result, []);
});

Deno.test("applyFilters - undefined filter value is ignored", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const result = applyFilters(items, { name: undefined });
  assertEquals(result, items);
});

Deno.test("applyFilters - null filter value is ignored", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ];

  const result = applyFilters(items, { name: null });
  assertEquals(result, items);
});

Deno.test("applyFilters - mixed filter types", () => {
  const items = [
    { id: "1", status: "completed", priority: 5, archived: false },
    { id: "2", status: "in_progress", priority: 5, archived: false },
    { id: "3", status: "completed", priority: 5, archived: true },
  ];

  const result = applyFilters(items, {
    status: "completed",
    priority: 5,
    archived: false,
  });
  assertEquals(result, [
    { id: "1", status: "completed", priority: 5, archived: false },
  ]);
});
