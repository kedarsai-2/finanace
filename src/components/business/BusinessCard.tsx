import { Pencil, Trash2, MapPin, BadgeCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Business } from "@/types/business";

interface Props {
  business: Business;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

export function BusinessCard({ business, active, onSelect, onEdit, onDelete }: Props) {
  const hasGst = Boolean(business.gstNumber);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-2xl border bg-card p-5 text-card-foreground transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        active
          ? "border-primary/60 ring-2 ring-primary/20 shadow-md shadow-primary/10"
          : "border-border",
      )}
    >
      {active && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          Active
        </span>
      )}

      <div className="flex items-start gap-4">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="h-14 w-14 rounded-xl object-cover ring-1 ring-border"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-lg font-semibold text-primary-foreground">
            {initials(business.name)}
          </div>
        )}

        <div className="min-w-0 flex-1 pr-16">
          <h3 className="truncate text-base font-semibold leading-tight">
            {business.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">
              {business.city}, {business.state}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
            hasGst
              ? "bg-success/10 text-success"
              : "bg-warning/15 text-warning-foreground/80",
          )}
        >
          {hasGst ? (
            <>
              <BadgeCheck className="h-3.5 w-3.5" />
              GST Added
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5" />
              No GST
            </>
          )}
        </span>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${business.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${business.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
