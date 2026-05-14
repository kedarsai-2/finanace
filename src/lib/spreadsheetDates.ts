/**
 * Civil calendar day → ISO instant at **noon UTC** for that date.
 * Avoids local-midnight → UTC flips (e.g. April 1 IST becoming March 31Z) so dashboards that
 * read `yyyy-MM-dd` from the string and backend `Instant` round-trips stay on the intended month.
 */
export function calendarToStableUtcNoonIso(year: number, monthIndex0: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex0, day, 12, 0, 0, 0)).toISOString();
}

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
    if (!Number.isFinite(t)) return new Date().toISOString();
    return calendarToStableUtcNoonIso(raw.getFullYear(), raw.getMonth(), raw.getDate());
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Excel serial date: days since 1899-12-30 (fractional part = time). ~25569 = 1970-01-01 UTC.
    if (raw > 0 && raw < 2_000_000) {
      const MS_PER_DAY = 86_400_000;
      const EXCEL_UNIX_EPOCH_SERIAL = 25_569;
      const serialWhole = Math.floor(raw);
      const ms = (serialWhole - EXCEL_UNIX_EPOCH_SERIAL) * MS_PER_DAY;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        return calendarToStableUtcNoonIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
    }
    // Unix timestamp (seconds or ms)
    if (raw > 1e9 && raw < 1e14) {
      const ms = raw < 1e12 ? raw * 1000 : raw;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) {
        return calendarToStableUtcNoonIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }
    }
  }

  const value = String(raw).trim();

  const ddmmyyyy = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (ddmmyyyy) {
    const dd = Number(ddmmyyyy[1]);
    const mm = Number(ddmmyyyy[2]);
    let yyyy = Number(ddmmyyyy[3]);
    if (yyyy < 100) yyyy += yyyy >= 70 ? 1900 : 2000;
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return calendarToStableUtcNoonIso(yyyy, mm - 1, dd);
    }
  }

  const isoDay = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoDay) {
    const y = Number(isoDay[1]);
    const mo = Number(isoDay[2]) - 1;
    const d = Number(isoDay[3]);
    if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) {
      return calendarToStableUtcNoonIso(y, mo, d);
    }
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return new Date().toISOString();
  return calendarToStableUtcNoonIso(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}
