import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useNotificationSettings } from "@/hooks/useNotifications";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/types/notification";

export const Route = createFileRoute("/notifications/settings")({
  component: NotificationSettingsPage,
});

function NotificationSettingsPage() {
  const { settings, save, hydrated } = useNotificationSettings();
  const [draft, setDraft] = useState(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    if (hydrated) setDraft(settings);
  }, [hydrated, settings]);

  const handleSave = () => {
    save({
      ...draft,
      reminderDaysBefore: Math.max(0, Math.min(30, Number(draft.reminderDaysBefore) || 0)),
    });
    toast.success("Notification settings saved");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BellRing className="h-5 w-5 text-primary" /> Notification Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which payment reminders and overdue alerts appear in your bell menu.
        </p>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Payment Reminders</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Notify before an invoice falls due so you can chase early.
              </p>
            </div>
            <Switch
              checked={draft.reminderEnabled}
              onCheckedChange={(v) => setDraft({ ...draft, reminderEnabled: v })}
            />
          </div>

          <div className="mt-4 grid max-w-xs gap-2">
            <Label htmlFor="reminderDays" className="text-sm">
              Days before due
            </Label>
            <Input
              id="reminderDays"
              type="number"
              min={0}
              max={30}
              disabled={!draft.reminderEnabled}
              value={draft.reminderDaysBefore}
              onChange={(e) => setDraft({ ...draft, reminderDaysBefore: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Default: 2 · Max: 30</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Overdue Alerts</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep flagging invoices past their due date until they're settled.
              </p>
            </div>
            <Switch
              checked={draft.overdueEnabled}
              onCheckedChange={(v) => setDraft({ ...draft, overdueEnabled: v })}
            />
          </div>

          <div className="mt-4 grid max-w-xs gap-2">
            <Label className="text-sm">Frequency</Label>
            <Select
              value={draft.overdueFrequency}
              onValueChange={(v) => setDraft({ ...draft, overdueFrequency: v as "daily" })}
              disabled={!draft.overdueEnabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
