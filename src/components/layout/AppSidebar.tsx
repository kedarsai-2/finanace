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
  FileMinus,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/parties", label: "Parties", icon: Users },
  { to: "/items", label: "Items", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/credit-notes", label: "Credit Notes", icon: FileMinus },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/purchase-returns", label: "Purchase Returns", icon: Undo2 },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/audit", label: "Audit", icon: History },
] as const;

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <Link to="/" className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl primary-gradient primary-glow">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">QOBOX</span>
          <span className="text-[10px] text-sidebar-foreground/60">Invoicing · Billing · Accounting</span>
        </div>
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
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
              activeProps={{
                className:
                  "bg-gradient-to-r from-primary/30 via-accent/20 to-transparent text-sidebar-foreground shadow-[inset_2px_0_0_0_var(--primary)]",
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 text-[10px] text-sidebar-foreground/40">
        © {new Date().getFullYear()} QOBOX
      </div>
    </aside>
  );
}
