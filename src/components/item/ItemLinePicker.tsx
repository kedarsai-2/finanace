import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Item } from "@/types/item";

type ItemLinePickerProps = {
  value: string;
  items: Item[];
  onSelect: (item: Item) => void;
  onChangeName: (value: string) => void;
  onQuickAdd: () => void;
  locked?: boolean;
  inputPlaceholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  quickAddLabel?: string;
  priceKey?: "sellingPrice" | "purchasePrice";
  sheetTitle?: string;
};

function ItemCommandList({
  items,
  onSelect,
  searchPlaceholder,
  emptyLabel,
  quickAddLabel,
  priceKey,
  onQuickAdd,
  listClassName,
}: {
  items: Item[];
  onSelect: (item: Item) => void;
  searchPlaceholder: string;
  emptyLabel: string;
  quickAddLabel: string;
  priceKey: "sellingPrice" | "purchasePrice";
  onQuickAdd: () => void;
  listClassName?: string;
}) {
  const active = items.filter((i) => i.active);
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} autoFocus />
      <CommandList className={listClassName}>
        <CommandEmpty>
          <div className="py-3 text-center text-sm text-muted-foreground">
            {emptyLabel}
            <button
              type="button"
              onClick={onQuickAdd}
              className="mt-1 block w-full text-primary hover:underline"
            >
              {quickAddLabel}
            </button>
          </div>
        </CommandEmpty>
        <CommandGroup>
          {active.map((it) => (
            <CommandItem
              key={it.id}
              value={`${it.name} ${it.sku ?? ""}`}
              onSelect={() => onSelect(it)}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.name}</p>
                  {it.sku ? (
                    <p className="truncate font-mono text-xs text-muted-foreground">{it.sku}</p>
                  ) : null}
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {priceKey === "purchasePrice"
                    ? (it.purchasePrice ?? it.sellingPrice)
                    : it.sellingPrice}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function ItemLinePicker({
  value,
  items,
  onSelect,
  onChangeName,
  onQuickAdd,
  locked,
  inputPlaceholder = "Search or type item…",
  searchPlaceholder = "Search items…",
  emptyLabel = "No items match.",
  quickAddLabel = "+ Quick add new item",
  priceKey = "sellingPrice",
  sheetTitle = "Select item",
}: ItemLinePickerProps) {
  const [open, setOpen] = useState(false);
  const useSheet = useResponsiveOverlay();

  const handleSelect = (item: Item) => {
    onSelect(item);
    setOpen(false);
  };

  const handleQuickAdd = () => {
    setOpen(false);
    onQuickAdd();
  };

  const openPicker = () => {
    if (!locked) setOpen(true);
  };

  const commandList = (
    <ItemCommandList
      items={items}
      onSelect={handleSelect}
      searchPlaceholder={searchPlaceholder}
      emptyLabel={emptyLabel}
      quickAddLabel={quickAddLabel}
      priceKey={priceKey}
      onQuickAdd={handleQuickAdd}
      listClassName={useSheet ? "max-h-[min(55dvh,420px)]" : undefined}
    />
  );

  const input = (
    <Input
      value={value}
      onChange={(e) => onChangeName(e.target.value)}
      onFocus={openPicker}
      onPointerDown={(e) => {
        if (locked) return;
        e.stopPropagation();
      }}
      onClick={(e) => {
        if (locked) return;
        e.stopPropagation();
        openPicker();
      }}
      readOnly={locked}
      placeholder={inputPlaceholder}
      className={cn("h-9", locked && "cursor-not-allowed bg-muted/50")}
    />
  );

  return (
    <div className="flex gap-1">
      {useSheet ? (
        <div className="flex-1">
          {input}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="bottom" className="flex max-h-[min(85dvh,640px)] flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border px-4 py-3 text-left">
                <SheetTitle>{sheetTitle}</SheetTitle>
                <SheetDescription className="sr-only">Search and choose an item</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]">
                {commandList}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1">{input}</div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(100vw-2rem,320px)] p-0"
            align="start"
            side="bottom"
            avoidCollisions
            collisionPadding={12}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {commandList}
          </PopoverContent>
        </Popover>
      )}
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="h-9 w-9 shrink-0"
        onClick={onQuickAdd}
        aria-label="Quick add item"
        disabled={locked}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
