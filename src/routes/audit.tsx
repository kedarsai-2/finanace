import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Eye, ShieldCheck, FileX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import {
  AUDIT_ACTION_LABEL,
  AUDIT_MODULE_LABEL,
  type AuditAction,
  type AuditEntry,
  type AuditModule,
} from "@/types/audit";

export const Route = createFileRoute("/audit")({
  component: AuditPage,
});

const MODULE_OPTIONS: AuditModule[] = [
  "party",
  "item",
  "invoice",
  "purchase",
  "payment",
  "expense",
  "expenseCategory",
  "account",
  "transfer",
  "business",
];

const ACTION_OPTIONS: AuditAction[] = ["create", "edit", "delete", "cancel", "payment"];

function actionBadgeVariant(action: AuditAction) {
  switch (action) {
    case "create":
      return "default" as const;
    case "edit":
      return "secondary" as const;
    case "delete":
      return "destructive" as const;
    case "cancel":
      return "outline" as const;
    case "payment":
      return "default" as const;
  }
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? v.toLocaleString() : String(v);
  if (typeof v === "object" && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    const lines = Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${formatFieldLabel(key)}: ${formatValue(value)}`);
    return lines.length ? lines.join("\n") : "—";
  }
  if (Array.isArray(v)) {
    if (!v.length) return "—";
    return v.map((entry) => `- ${formatValue(entry)}`).join("\n");
  }
  return String(v);
}

function formatFieldLabel(field: string): string {
  const withSpaces = field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!withSpaces) return field;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function AuditPage() {
  // Audit is a workspace-wide log; don't hide entries when switching businesses.
  useBusinesses();
  const { logs, hydrated } = useAuditLogs(null);

  const [user, setUser] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [active, setActive] = useState<AuditEntry | null>(null);

  const userOptions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.user))).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (user !== "all" && l.user !== user) return false;
      if (moduleFilter !== "all" && l.module !== moduleFilter) return false;
      if (action !== "all" && l.action !== action) return false;
      if (from && l.timestamp < from) return false;
      if (to && l.timestamp > `${to}T23:59:59.999Z`) return false;
      return true;
    });
  }, [logs, user, moduleFilter, action, from, to]);

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" /> Activity Logs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every create, edit, delete, cancel and payment recorded across the app.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filtered.length.toLocaleString()} of {logs.length.toLocaleString()} entries
        </Badge>
      </header>

      <section className="mb-4 rounded-xl border border-border bg-card p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">User</Label>
            <Select value={user} onValueChange={setUser}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {userOptions.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Module</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {MODULE_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {AUDIT_MODULE_LABEL[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {AUDIT_ACTION_LABEL[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">User</TableHead>
              <TableHead className="w-[120px]">Module</TableHead>
              <TableHead className="w-[110px]">Action</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="w-[120px] text-right">Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hydrated ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-16">
                  <div className="grid place-items-center text-center">
                    <FileX className="mb-2 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No activity yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create, edit or delete records and they'll show up here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => {
                const changeCount =
                  entry.changes?.length ??
                  (entry.snapshot ? Object.keys(entry.snapshot).length : 0);
                return (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => setActive(entry)}
                  >
                    <TableCell className="font-mono text-xs">
                      {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-sm">{entry.user}</TableCell>
                    <TableCell className="text-sm">{AUDIT_MODULE_LABEL[entry.module]}</TableCell>
                    <TableCell>
                      <Badge variant={actionBadgeVariant(entry.action)} className="text-[10px]">
                        {AUDIT_ACTION_LABEL[entry.action]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-sm">
                      {entry.reference}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActive(entry);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {changeCount} {changeCount === 1 ? "field" : "fields"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DiffDialog entry={active} onClose={() => setActive(null)} />
    </div>
  );
}

function DiffDialog({ entry, onClose }: { entry: AuditEntry | null; onClose: () => void }) {
  return (
    <Dialog open={!!entry} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {AUDIT_MODULE_LABEL[entry.module]}
                <Badge variant={actionBadgeVariant(entry.action)} className="text-[10px]">
                  {AUDIT_ACTION_LABEL[entry.action]}
                </Badge>
                <span className="font-normal text-muted-foreground">· {entry.reference}</span>
              </DialogTitle>
              <DialogDescription>
                {format(new Date(entry.timestamp), "EEE, dd MMM yyyy 'at' HH:mm:ss")} · by{" "}
                {entry.user}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-2">
              {entry.changes && entry.changes.length > 0 ? (
                <div className="overflow-hidden rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Field</TableHead>
                        <TableHead>Old value</TableHead>
                        <TableHead>New value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.changes.map((c) => (
                        <TableRow key={c.field}>
                          <TableCell className="align-top text-xs font-medium">
                            {formatFieldLabel(c.field)}
                          </TableCell>
                          <TableCell
                            className={cn("align-top font-mono text-xs", "text-destructive")}
                          >
                            <pre className="whitespace-pre-wrap break-all">
                              {formatValue(c.before)}
                            </pre>
                          </TableCell>
                          <TableCell className="align-top font-mono text-xs text-emerald-600 dark:text-emerald-400">
                            <pre className="whitespace-pre-wrap break-all">
                              {formatValue(c.after)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : entry.snapshot ? (
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {entry.action === "delete" || entry.action === "cancel"
                      ? "Snapshot before deletion:"
                      : "Snapshot:"}
                  </p>
                  <pre className="overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                    {formatValue(entry.snapshot)}
                  </pre>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No detail recorded.
                </p>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
