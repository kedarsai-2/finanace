import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useResponsiveOverlay } from "@/hooks/use-responsive-overlay";
import { cn } from "@/lib/utils";

type DatePickerFieldProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  title?: string;
  formatStr?: string;
  variant?: "field" | "chip" | "filter";
  className?: string;
  buttonClassName?: string;
};

function ClearDateHeader({
  value,
  onChange,
  onClose,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <span className="text-xs text-muted-foreground">Pick a date</span>
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange(undefined);
            onClose();
          }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  clearable,
  title = "Select date",
  formatStr = "dd MMM yyyy",
  variant = "field",
  className,
  buttonClassName,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const useSheet = useResponsiveOverlay();

  const label = value ? format(value, formatStr) : placeholder;

  const triggerClass = cn(
    variant === "chip" &&
      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
    variant === "chip" && (value ? "text-foreground" : "text-muted-foreground hover:text-foreground"),
    variant === "filter" && "h-10 w-full justify-between font-normal text-white hover:text-white",
    variant === "field" && "h-10 w-full justify-between font-normal",
    variant === "filter" && !value && "text-white/80",
    variant === "field" && !value && "text-muted-foreground",
    buttonClassName,
  );

  const trigger =
    variant === "chip" ? (
      <button
        type="button"
        disabled={disabled}
        className={cn(triggerClass, className)}
        onClick={useSheet ? () => setOpen(true) : undefined}
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        {label}
      </button>
    ) : (
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn(triggerClass, className)}
        onClick={useSheet ? () => setOpen(true) : undefined}
      >
        {variant === "filter" ? (
          <span className={cn(!value && "text-white/80")}>{label}</span>
        ) : (
          label
        )}
        <CalendarIcon
          className={cn(
            "ml-2 h-4 w-4 shrink-0",
            variant === "filter" ? "text-white/85" : "opacity-50",
          )}
        />
      </Button>
    );

  const calendarPanel = (
    <>
      {clearable ? <ClearDateHeader value={value} onChange={onChange} onClose={() => setOpen(false)} /> : null}
      <Calendar
        mode="single"
        selected={value}
        onSelect={(d) => {
          onChange(d ?? undefined);
          if (d) setOpen(false);
        }}
        initialFocus
        className={cn("p-3 pointer-events-auto")}
      />
    </>
  );

  if (useSheet) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="flex max-h-[min(85dvh,520px)] flex-col gap-0 p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription className="sr-only">Choose a date from the calendar</SheetDescription>
            </SheetHeader>
            <div className="overflow-auto pb-[env(safe-area-inset-bottom)]">{calendarPanel}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        side="bottom"
        avoidCollisions
        collisionPadding={12}
      >
        {calendarPanel}
      </PopoverContent>
    </Popover>
  );
}
