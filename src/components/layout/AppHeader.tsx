import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { BusinessSwitcher } from "@/components/business/BusinessSwitcher";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Ledgerly
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <BusinessSwitcher />
        </div>
      </div>
    </header>
  );
}
