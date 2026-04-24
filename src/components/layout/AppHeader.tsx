import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { BusinessSwitcher } from "@/components/business/BusinessSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { USE_BACKEND } from "@/lib/flags";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/businesses", label: "Businesses" },
  { to: "/parties", label: "Parties" },
  { to: "/items", label: "Items" },
  { to: "/invoices", label: "Sales" },
  { to: "/purchases", label: "Purchases" },
  { to: "/payments", label: "Payments" },
  { to: "/accounts", label: "Bank Accounts" },
  { to: "/cash", label: "Cash" },
  { to: "/expenses", label: "Expenses" },
  { to: "/reports", label: "Reports" },
  { to: "/audit", label: "Audit" },
] as const;

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthed, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 glass border-b border-border/40">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl primary-gradient primary-glow">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">QOBOX</span>
            </Link>
            <nav className="flex flex-col gap-0.5 px-2">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: l.to === "/" }}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                  activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
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
          {USE_BACKEND && isAuthed ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Logout"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
