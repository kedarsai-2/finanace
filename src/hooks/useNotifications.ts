import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type AppNotification,
  type NotificationSettings,
} from "@/types/notification";
import type { Invoice } from "@/types/invoice";
import { paymentStatusOf } from "@/types/invoice";

const SETTINGS_KEY = "bm.notificationSettings";
const READ_KEY = "bm.notificationRead";
const DISMISS_KEY = "bm.notificationDismissed";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daysBetween(a: number, b: number) {
  return Math.round((a - b) / (24 * 60 * 60 * 1000));
}

export function deriveNotifications(
  invoices: Invoice[],
  settings: NotificationSettings,
  now: Date = new Date(),
): AppNotification[] {
  const today = startOfDay(now);
  const out: AppNotification[] = [];

  for (const inv of invoices) {
    if (inv.deleted || inv.status !== "final" || !inv.dueDate) continue;
    const status = paymentStatusOf(inv);
    if (status === "paid") continue;
    const due = startOfDay(new Date(inv.dueDate));
    const daysFromDue = daysBetween(today, due); // negative => before due
    const balance = Math.max(0, inv.total - inv.paidAmount);

    if (daysFromDue < 0 && settings.reminderEnabled) {
      const daysAhead = -daysFromDue;
      if (daysAhead <= settings.reminderDaysBefore) {
        out.push({
          id: `rem_${inv.id}_${due}`,
          kind: "reminder",
          title: `Payment due in ${daysAhead} day${daysAhead === 1 ? "" : "s"}`,
          message: `${inv.number} · ${inv.partyName} · ₹${balance.toLocaleString("en-IN")}`,
          date: now.toISOString(),
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          partyName: inv.partyName,
          amount: balance,
          daysFromDue,
          refLink: `/invoices/${inv.id}`,
        });
      }
    } else if (daysFromDue >= 0 && settings.overdueEnabled) {
      out.push({
        id: `ovr_${inv.id}_${due}`,
        kind: "overdue",
        title:
          daysFromDue === 0
            ? "Due today"
            : `Overdue by ${daysFromDue} day${daysFromDue === 1 ? "" : "s"}`,
        message: `${inv.number} · ${inv.partyName} · ₹${balance.toLocaleString("en-IN")}`,
        date: now.toISOString(),
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        partyName: inv.partyName,
        amount: balance,
        daysFromDue,
        refLink: `/invoices/${inv.id}`,
      });
    }
  }

  // Sort: most urgent first (highest daysFromDue, then nearest reminder).
  out.sort((a, b) => b.daysFromDue - a.daysFromDue);
  return out;
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(readJson<NotificationSettings>(SETTINGS_KEY, DEFAULT_NOTIFICATION_SETTINGS));
    setHydrated(true);
  }, []);

  const save = useCallback((next: NotificationSettings) => {
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  return { settings, save, hydrated };
}

export function useNotifications(invoices: Invoice[]) {
  const { settings, hydrated: settingsHydrated } = useNotificationSettings();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReadIds(readJson<string[]>(READ_KEY, []));
    setDismissedIds(readJson<string[]>(DISMISS_KEY, []));
    setHydrated(true);
  }, []);

  const persistRead = useCallback((ids: string[]) => {
    setReadIds(ids);
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  }, []);

  const persistDismissed = useCallback((ids: string[]) => {
    setDismissedIds(ids);
    localStorage.setItem(DISMISS_KEY, JSON.stringify(ids));
  }, []);

  const all = hydrated && settingsHydrated ? deriveNotifications(invoices, settings) : [];
  const live = all.filter((n) => !dismissedIds.includes(n.id));
  const readSet = new Set(readIds);
  const enriched = live.map((n) => ({ ...n, read: readSet.has(n.id) }));
  const unreadCount = enriched.filter((n) => !n.read).length;

  const markRead = useCallback(
    (id: string) => {
      if (readIds.includes(id)) return;
      persistRead([...readIds, id]);
    },
    [readIds, persistRead],
  );

  const markAllRead = useCallback(() => {
    const ids = Array.from(new Set([...readIds, ...live.map((n) => n.id)]));
    persistRead(ids);
  }, [readIds, live, persistRead]);

  const dismiss = useCallback(
    (id: string) => {
      persistDismissed([...dismissedIds, id]);
    },
    [dismissedIds, persistDismissed],
  );

  return {
    notifications: enriched,
    unreadCount,
    markRead,
    markAllRead,
    dismiss,
    hydrated: hydrated && settingsHydrated,
  };
}
