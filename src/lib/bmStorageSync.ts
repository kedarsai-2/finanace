/** Same-tab sync: multiple hook instances share localStorage but not React state. */

export const BM_STORAGE_SYNC_EVENT = "glow-bm-storage-sync";

export type BmStorageSyncDetail = { key: string };

export function notifyBmStorageSync(key: string) {
  if (typeof window === "undefined") return;
  // Defer so listeners don't run synchronously inside a hook's setState → persist path
  // (avoids re-entrancy / max-update-depth when many components share the same key).
  queueMicrotask(() => {
    window.dispatchEvent(
      new CustomEvent<BmStorageSyncDetail>(BM_STORAGE_SYNC_EVENT, { detail: { key } }),
    );
  });
}

export function subscribeBmStorageSync(key: string, callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (ev: Event) => {
    const e = ev as CustomEvent<BmStorageSyncDetail>;
    if (e.detail?.key === key) callback();
  };
  window.addEventListener(BM_STORAGE_SYNC_EVENT, handler as EventListener);
  return () => window.removeEventListener(BM_STORAGE_SYNC_EVENT, handler as EventListener);
}
