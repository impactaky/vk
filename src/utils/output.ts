export function printTable(headers: string[], rows: string[][]): void {
  if (rows.length === 0) {
    console.log("No results found.");
    return;
  }

  const widths = headers.map((header, i) => {
    const maxRowWidth = Math.max(...rows.map((row) => (row[i] || "").length));
    return Math.max(header.length, maxRowWidth);
  });

  const headerRow = headers.map((header, i) => header.padEnd(widths[i])).join("  ");
  console.log(headerRow);
  console.log(widths.map((w) => "-".repeat(w)).join("  "));

  for (const row of rows) {
    const formattedRow = row.map((cell, i) => (cell || "").padEnd(widths[i])).join("  ");
    console.log(formattedRow);
  }
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printError(message: string): void {
  console.error(`Error: ${message}`);
}

export function printSuccess(message: string): void {
  console.log(`✓ ${message}`);
}

export function printInfo(message: string): void {
  console.log(message);
}
