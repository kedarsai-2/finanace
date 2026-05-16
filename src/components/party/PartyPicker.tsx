import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";

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
  id?: string;
  /** Show a clearable “no party” option (value is `emptyValue`, default ""). */
  allowEmpty?: boolean;
  emptyValue?: string;
  emptyOptionLabel?: string;
  /** Show an “all parties” filter option (value is `allValue`, default "all"). */
  allowAll?: boolean;
  allValue?: string;
  allOptionLabel?: string;
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


function resolveDisplayLabel({
  parties,
  value,
  placeholder,
  allowEmpty,
  emptyValue,
  emptyOptionLabel,
  allowAll,
  allValue,
  allOptionLabel,
}: {
  parties: Party[];
  value: string | null;
  placeholder: string;
  allowEmpty?: boolean;
  emptyValue: string;
  emptyOptionLabel?: string;
  allowAll?: boolean;
  allValue: string;
  allOptionLabel?: string;
}): string {
  if (allowAll && value === allValue) return allOptionLabel ?? "All parties";
  if (allowEmpty && (value == null || value === "" || value === emptyValue)) {
    return emptyOptionLabel ?? placeholder;
  }
  const party = parties.find((p) => p.id === value);
  return party?.name ?? placeholder;
}

function PartyCommandList({
  parties,
  onSelect,
  searchPlaceholder,
  emptyLabel,
  listClassName,
  allowEmpty,
  emptyValue,
  emptyOptionLabel,
  allowAll,
  allValue,
  allOptionLabel,
}: {
  parties: Party[];
  onSelect: (partyId: string) => void;
  searchPlaceholder: string;
  emptyLabel: string;
  listClassName?: string;
  allowEmpty?: boolean;
  emptyValue: string;
  emptyOptionLabel?: string;
  allowAll?: boolean;
  allValue: string;
  allOptionLabel?: string;
}) {
  const validParties = parties.filter((p) => !!p.id);

  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} autoFocus />
      <CommandList className={listClassName}>
        <CommandEmpty>{emptyLabel}</CommandEmpty>
        <CommandGroup>
          {allowAll && (
            <CommandItem value={allOptionLabel ?? "all parties"} onSelect={() => onSelect(allValue)}>
              <span className="font-medium">{allOptionLabel ?? "All parties"}</span>
            </CommandItem>
          )}
          {allowEmpty && (
            <CommandItem
              value={emptyOptionLabel ?? "no party"}
              onSelect={() => onSelect(emptyValue)}
            >
              <span className="font-medium">{emptyOptionLabel ?? "No party"}</span>
            </CommandItem>
          )}
          {validParties.map((p) => (
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
  id,
  allowEmpty,
  emptyValue = "",
  emptyOptionLabel,
  allowAll,
  allValue = "all",
  allOptionLabel,
}: PartyPickerProps) {
  const [open, setOpen] = useState(false);
  const useSheetPicker = useResponsiveOverlay();

  const displayLabel = useMemo(
    () =>
      resolveDisplayLabel({
        parties,
        value,
        placeholder,
        allowEmpty,
        emptyValue,
        emptyOptionLabel,
        allowAll,
        allValue,
        allOptionLabel,
      }),
    [
      parties,
      value,
      placeholder,
      allowEmpty,
      emptyValue,
      emptyOptionLabel,
      allowAll,
      allValue,
      allOptionLabel,
    ],
  );

  const hasSelection = useMemo(() => {
    if (allowAll && value === allValue) return true;
    if (allowEmpty && (value == null || value === "" || value === emptyValue)) return false;
    return !!parties.find((p) => p.id === value);
  }, [allowAll, allValue, allowEmpty, emptyValue, parties, value]);

  const handleSelect = (partyId: string) => {
    onChange(partyId);
    setOpen(false);
  };

  const commandList = (
    <PartyCommandList
      parties={parties}
      onSelect={handleSelect}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      allowEmpty={allowEmpty}
      emptyValue={emptyValue}
      emptyOptionLabel={emptyOptionLabel}
      allowAll={allowAll}
      allValue={allValue}
      allOptionLabel={allOptionLabel}
    />
  );

  const trigger = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      id={id}
      disabled={disabled}
      aria-expanded={open}
      className={cn(
        "h-10 w-full justify-between font-normal",
        !hasSelection && "text-muted-foreground",
        triggerClassName,
      )}
      onClick={useSheetPicker ? () => setOpen(true) : undefined}
    >
      <span className="truncate">{displayLabel}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                allowEmpty={allowEmpty}
                emptyValue={emptyValue}
                emptyOptionLabel={emptyOptionLabel}
                allowAll={allowAll}
                allValue={allValue}
                allOptionLabel={allOptionLabel}
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
        {commandList}
      </PopoverContent>
    </Popover>
  );
}
