import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { USE_BACKEND } from "@/lib/flags";
import { getJwt } from "@/lib/auth";

type MobileTabsResponse = { hiddenTabs?: string[] };

function isNativePlatform() {
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function useMobileTabSettings() {
  const [hiddenTabs, setHiddenTabs] = useState<Record<string, true>>({});
  const [hydrated, setHydrated] = useState(false);
  const canSync = USE_BACKEND && !!getJwt();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canSync) {
        setHiddenTabs({});
        setHydrated(true);
        return;
      }
      try {
        const res = await apiFetch<MobileTabsResponse>("/api/account/mobile-tabs");
        const map: Record<string, true> = {};
        for (const tab of res.hiddenTabs ?? []) map[tab] = true;
        if (!cancelled) setHiddenTabs(map);
      } catch {
        if (!cancelled) setHiddenTabs({});
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [canSync]);

  const saveHiddenTabs = useCallback(
    async (next: Record<string, true>) => {
      setHiddenTabs(next);
      if (!canSync) return;
      await apiFetch<MobileTabsResponse>("/api/account/mobile-tabs", {
        method: "PUT",
        body: JSON.stringify({ hiddenTabs: Object.keys(next) }),
      });
    },
    [canSync],
  );

  return useMemo(
    () => ({
      hiddenTabs,
      hydrated,
      saveHiddenTabs,
      isNative: typeof window !== "undefined" && isNativePlatform(),
    }),
    [hiddenTabs, hydrated, saveHiddenTabs],
  );
}
