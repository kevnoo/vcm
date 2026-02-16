/**
 * Escape a CSV cell value: wrap in quotes if it contains commas, quotes, or newlines.
 */
function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger a CSV file download in the browser.
 * @param filename - Name of the downloaded file (should end in .csv)
 * @param rows - Array of string arrays; the first row is treated as headers
 */
export function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
