import { Link } from "@tanstack/react-router";
import {
  LayoutGrid,
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  ShoppingCart,
  Wallet,
  Landmark,
  Receipt,
  BarChart3,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/parties", label: "Parties", icon: Users },
  { to: "/items", label: "Items", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/audit", label: "Audit", icon: History },
] as const;

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border/60 bg-background/85 backdrop-blur md:flex">
      <Link to="/" className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Ledgerly</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
        {navLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              )}
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Icon className="h-4 w-4" />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
