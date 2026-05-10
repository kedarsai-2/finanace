/**
 * Parse date cells from Excel/CSV imports.
 * Handles native Date objects, Excel serial day numbers, dd/mm/yyyy, yyyy-mm-dd, and ISO strings.
 */
export function parseSpreadsheetDate(raw: unknown): string {
  if (raw == null || raw === "") {
    return new Date().toISOString();
  }
  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isFinite(t) ? raw.toISOString() : new Date().toISOString();
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Excel serial date: days since 1899-12-30 (fractional part = time). ~25569 = 1970-01-01 UTC.
    if (raw > 0 && raw < 2_000_000) {
      const MS_PER_DAY = 86_400_000;
      const EXCEL_UNIX_EPOCH_SERIAL = 25_569;
      const ms = (raw - EXCEL_UNIX_EPOCH_SERIAL) * MS_PER_DAY;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    // Unix timestamp (seconds or ms)
    if (raw > 1e9 && raw < 1e14) {
      const ms = raw < 1e12 ? raw * 1000 : raw;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }

  const value = String(raw).trim();

  const ddmmyyyy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (ddmmyyyy) {
    const dd = Number(ddmmyyyy[1]);
    const mm = Number(ddmmyyyy[2]);
    let yyyy = Number(ddmmyyyy[3]);
    if (yyyy < 100) yyyy += yyyy >= 70 ? 1900 : 2000;
    const parsed = new Date(yyyy, mm - 1, dd);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const isoDay = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoDay) {
    const parsed = new Date(Number(isoDay[1]), Number(isoDay[2]) - 1, Number(isoDay[3]));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
}
