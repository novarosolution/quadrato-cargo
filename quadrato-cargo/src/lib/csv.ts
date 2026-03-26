/** RFC-style CSV cell (always quoted for simplicity). */
export function csvCell(value: string): string {
  const s = value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  return `"${s.replaceAll('"', '""')}"`;
}

export function toCsvRow(cells: string[]): string {
  return `${cells.map(csvCell).join(",")}\n`;
}
