import { Link } from "@tanstack/react-router";
import { LayoutGrid, Menu } from "lucide-react";
import { useState } from "react";
import { BusinessSwitcher } from "@/components/business/BusinessSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/businesses", label: "Businesses" },
  { to: "/parties", label: "Parties" },
  { to: "/items", label: "Items" },
  { to: "/invoices", label: "Invoices" },
  { to: "/purchases", label: "Purchases" },
  { to: "/payments", label: "Payments" },
  { to: "/accounts", label: "Accounts" },
  { to: "/expenses", label: "Expenses" },
  { to: "/reports", label: "Reports" },
  { to: "/audit", label: "Audit" },
] as const;

export function AppHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">Ledgerly</span>
            </Link>
            <nav className="flex flex-col gap-0.5 px-2">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: l.to === "/" }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  )}
                  activeProps={{ className: "bg-accent text-foreground" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <BusinessSwitcher />
        </div>
      </div>
    </header>
  );
}
