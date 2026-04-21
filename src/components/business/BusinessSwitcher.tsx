import { useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus, Building2, Search, Layers } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBusinesses } from "@/hooks/useBusinesses";
import type { Business } from "@/types/business";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

function Avatar({ business, size = 32 }: { business?: Business; size?: number }) {
  const dim = { width: size, height: size };
  if (business?.logoUrl) {
    return (
      <img
        src={business.logoUrl}
        alt=""
        style={dim}
        className="shrink-0 rounded-lg object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <div
      style={dim}
      className="flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-[11px] font-semibold text-primary-foreground"
    >
      {business ? initials(business.name) : <Building2 className="h-4 w-4" />}
    </div>
  );
}

export function BusinessSwitcher() {
  const { businesses, activeId, setActiveId, hydrated } = useBusinesses();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const active = useMemo(
    () => businesses.find((b) => b.id === activeId),
    [businesses, activeId],
  );
  const isAll = activeId === "__all__";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q),
    );
  }, [businesses, query]);

  const handlePick = (b: Business) => {
    setOpen(false);
    if (b.id === activeId) return;
    setActiveId(b.id);
    toast.success(`Switched to ${b.name}`);
    // Reload dependent data (invoices, parties, items) for the new context.
    router.invalidate();
  };

  const handlePickAll = () => {
    setOpen(false);
    if (isAll) return;
    setActiveId("__all__");
    toast.success("Showing all companies");
    router.invalidate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Switch business"
          className="h-12 w-full justify-between gap-3 px-3 sm:w-[280px]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {isAll ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary text-primary-foreground">
                <Layers className="h-4 w-4" />
              </div>
            ) : (
              <Avatar business={active} />
            )}
            <div className="min-w-0 text-left">
              <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Active business
              </p>
              <p className="truncate text-sm font-semibold leading-tight">
                {hydrated
                  ? isAll
                    ? "All Companies"
                    : active?.name ?? "Select a business"
                  : "Loading…"}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
      >
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search businesses…"
              className="h-9 pl-8"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          <button
            type="button"
            onClick={handlePickAll}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
              "hover:bg-accent",
              isAll && "bg-primary/5",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium leading-tight">All Companies</p>
              <p className="truncate text-xs text-muted-foreground">Combined view across all businesses</p>
            </div>
            {isAll && <Check className="h-4 w-4 shrink-0 text-primary" />}
          </button>
          <div className="my-1 h-px bg-border" />
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No businesses match "{query}"
            </p>
          ) : (
            filtered.map((b) => {
              const isActive = b.id === activeId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handlePick(b)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent",
                    isActive && "bg-primary/5",
                  )}
                >
                  <Avatar business={b} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.city}, {b.state}
                      {b.gstNumber ? " • GST" : ""}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border p-1">
          <Button
            asChild
            variant="ghost"
            className="h-10 w-full justify-start gap-2 font-medium text-primary hover:text-primary"
            onClick={() => setOpen(false)}
          >
            <Link to="/businesses/new">
              <Plus className="h-4 w-4" />
              Add Business
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
