import { Link } from "@tanstack/react-router";
import { Bell, BellOff, CheckCheck, Settings as SettingsIcon, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const { activeId } = useBusinesses();
  const { invoices } = useInvoices(activeId);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications(invoices);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-content-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
              <Link to="/notifications/settings" aria-label="Notification settings">
                <SettingsIcon className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="grid place-items-center px-6 py-10 text-center">
            <BellOff className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payment reminders and overdue alerts will show up here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "group relative px-3 py-2.5 transition-colors hover:bg-muted/60",
                    !n.read && "bg-primary/[0.04]",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            n.kind === "overdue"
                              ? "text-destructive"
                              : "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {n.kind === "overdue" ? "Overdue" : "Reminder"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {formatDistanceToNow(new Date(n.date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm font-medium leading-snug">{n.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Link
                          to="/invoices/$id"
                          params={{ id: n.invoiceId }}
                          className="text-xs font-medium text-primary hover:underline"
                          onClick={() => markRead(n.id)}
                        >
                          View invoice
                        </Link>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => dismiss(n.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
