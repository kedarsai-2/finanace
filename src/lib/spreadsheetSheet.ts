import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parse a worksheet into row objects by locating the header row that contains
 * `markerHeader` (e.g. "Party Name", "Item Name"). Falls back to the first row
 * whose first cell looks like "Date".
 *
 * Avoids fixed `range: N` in sheet_to_json, which breaks exports where headers
 * sit on row 0 (no title rows) or require different skips per export tool.
 */
export function sheetToObjectsByHeaderMarker(
  sheet: WorkSheet,
  markerHeader: string | string[],
): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
  const markers = (Array.isArray(markerHeader) ? markerHeader : [markerHeader]).map((m) =>
    m.trim().toLowerCase(),
  );

  let headerIdx = matrix.findIndex(
    (row) =>
      Array.isArray(row) &&
      row.some((cell) => markers.includes(String(cell ?? "").trim().toLowerCase())),
  );
  if (headerIdx < 0) {
    headerIdx = matrix.findIndex(
      (row) =>
        Array.isArray(row) &&
        row.length > 0 &&
        String(row[0] ?? "").trim().toLowerCase() === "date",
    );
  }
  if (headerIdx < 0) headerIdx = 0;

  const headerRow = (matrix[headerIdx] as unknown[]) ?? [];
  const headers = headerRow.map((h, i) => {
    const s = String(h ?? "").trim();
    return s || `__EMPTY_${i}`;
  });

  const out: Record<string, unknown>[] = [];
  for (let r = headerIdx + 1; r < matrix.length; r++) {
    const row = (matrix[r] as unknown[]) ?? [];
    const obj: Record<string, unknown> = {};
    let any = false;
    for (let c = 0; c < headers.length; c++) {
      const v = row[c];
      obj[headers[c]] = v ?? "";
      if (String(v ?? "").trim() !== "") any = true;
    }
    if (any) out.push(obj);
  }
  return out;
}
