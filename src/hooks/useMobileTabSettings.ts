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
  const authToken = getJwt();
  const canSync = USE_BACKEND && !!authToken;
  const isNative = typeof window !== "undefined" && isNativePlatform();

  const loadHiddenTabs = useCallback(async () => {
    if (!canSync) {
      setHiddenTabs({});
      setHydrated(true);
      return;
    }
    try {
      const res = await apiFetch<MobileTabsResponse>("/api/account/mobile-tabs");
      const map: Record<string, true> = {};
      for (const tab of res.hiddenTabs ?? []) map[tab] = true;
      setHiddenTabs(map);
    } catch {
      setHiddenTabs({});
    } finally {
      setHydrated(true);
    }
  }, [canSync]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!cancelled) await loadHiddenTabs();
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authToken, loadHiddenTabs]);

  useEffect(() => {
    if (!isNative || !canSync) return;

    const refresh = () => void loadHiddenTabs();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const intervalId = window.setInterval(refresh, 30_000);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(intervalId);
    };
  }, [canSync, isNative, loadHiddenTabs]);

  const saveHiddenTabs = useCallback(
    async (next: Record<string, true>) => {
      if (!canSync) {
        setHiddenTabs(next);
        return;
      }
      await apiFetch<MobileTabsResponse>("/api/account/mobile-tabs", {
        method: "PUT",
        body: JSON.stringify({ hiddenTabs: Object.keys(next) }),
      });
      setHiddenTabs(next);
    },
    [canSync],
  );

  return useMemo(
    () => ({
      hiddenTabs,
      hiddenTabList: Object.keys(hiddenTabs),
      hydrated,
      saveHiddenTabs,
      isNative,
    }),
    [hiddenTabs, hydrated, isNative, saveHiddenTabs],
  );
}
