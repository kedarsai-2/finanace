import { Link } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { BusinessSwitcher } from "@/components/business/BusinessSwitcher";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Businesses" },
  { to: "/parties", label: "Parties" },
  { to: "/items", label: "Items" },
  { to: "/invoices", label: "Invoices" },
  { to: "/purchases", label: "Purchases" },
] as const;

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

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              )}
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <BusinessSwitcher />
        </div>
      </div>
    </header>
  );
}
