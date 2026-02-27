/**
 * Simple CSV parser that handles quoted fields, commas within quotes, and escaped quotes.
 * No external dependencies needed.
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current.trim());
        current = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current.trim());
        if (row.some((cell) => cell !== '')) {
          rows.push(row);
        }
        row = [];
        current = '';
        if (char === '\r') i++; // skip \n in \r\n
      } else {
        current += char;
      }
    }
  }

  // Final row
  row.push(current.trim());
  if (row.some((cell) => cell !== '')) {
    rows.push(row);
  }

  return rows;
}
