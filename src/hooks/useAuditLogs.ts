import { useEffect, useState } from "react";
import { readAuditLogs } from "@/lib/audit";
import type { AuditEntry } from "@/types/audit";

export function useAuditLogs(businessId?: string | null) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => setLogs(readAuditLogs());
    refresh();
    setHydrated(true);

    const onChange = () => refresh();
    window.addEventListener("bm.audit.changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("bm.audit.changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const scoped = businessId
    ? logs.filter((l) => !l.businessId || l.businessId === businessId)
    : logs;

  // Newest first.
  const sorted = [...scoped].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { logs: sorted, allLogs: logs, hydrated };
}
