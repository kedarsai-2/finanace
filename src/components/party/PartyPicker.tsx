import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useResponsiveOverlay } from "@/hooks/use-responsive-overlay";
import { cn } from "@/lib/utils";
import type { Party } from "@/types/party";

type PartyPickerProps = {
  parties: Party[];
  value: string | null;
  onChange: (partyId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
};

function PartyOption({ party }: { party: Party }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium">{party.name}</span>
      <span className="text-xs text-muted-foreground">
        {party.mobile}
        {party.state ? ` • ${party.state}` : ""}
      </span>
    </div>
  );
}

function PartyCommandList({
  parties,
  onSelect,
  searchPlaceholder,
  emptyLabel,
  listClassName,
}: {
  parties: Party[];
  onSelect: (partyId: string) => void;
  searchPlaceholder: string;
  emptyLabel: string;
  listClassName?: string;
}) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList className={listClassName}>
        <CommandEmpty>{emptyLabel}</CommandEmpty>
        <CommandGroup>
          {parties.map((p) => (
            <CommandItem key={p.id} value={`${p.name} ${p.mobile}`} onSelect={() => onSelect(p.id)}>
              <PartyOption party={p} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function PartyPicker({
  parties,
  value,
  onChange,
  disabled,
  placeholder = "Select party…",
  triggerClassName,
  searchPlaceholder = "Search parties…",
  emptyLabel = "No parties found.",
}: PartyPickerProps) {
  const [open, setOpen] = useState(false);
  const useSheetPicker = useResponsiveOverlay();
  const selected = useMemo(() => parties.find((p) => p.id === value), [parties, value]);

  const handleSelect = (partyId: string) => {
    onChange(partyId);
    setOpen(false);
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      disabled={disabled}
      aria-expanded={open}
      className={cn(
        "h-10 w-full justify-between font-normal text-white hover:text-white",
        !selected && "text-white/80",
        triggerClassName,
      )}
      onClick={useSheetPicker ? () => setOpen(true) : undefined}
    >
      {selected ? selected.name : placeholder}
      <SearchIcon className="ml-2 h-4 w-4 shrink-0 text-white/85" />
    </Button>
  );

  if (useSheetPicker) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="flex max-h-[min(85dvh,640px)] flex-col gap-0 p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle>Select party</SheetTitle>
              <SheetDescription className="sr-only">Search and choose a party</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
              <PartyCommandList
                parties={parties}
                onSelect={handleSelect}
                searchPlaceholder={searchPlaceholder}
                emptyLabel={emptyLabel}
                listClassName="max-h-[min(55dvh,420px)]"
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        avoidCollisions
        collisionPadding={12}
      >
        <PartyCommandList
          parties={parties}
          onSelect={handleSelect}
          searchPlaceholder={searchPlaceholder}
          emptyLabel={emptyLabel}
        />
      </PopoverContent>
    </Popover>
  );
}
