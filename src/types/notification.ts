export type NotificationKind = "reminder" | "overdue";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  date: string; // ISO — when the alert is "as of"
  invoiceId: string;
  invoiceNumber: string;
  partyName: string;
  amount: number;
  daysFromDue: number; // negative = before due, positive = past due
  refLink: string;
}

export interface NotificationSettings {
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  overdueEnabled: boolean;
  overdueFrequency: "daily";
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  reminderEnabled: true,
  reminderDaysBefore: 2,
  overdueEnabled: true,
  overdueFrequency: "daily",
};
