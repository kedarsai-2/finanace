import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutGrid,
  LayoutDashboard,
  Building2,
  Users,
  Package,
  ImageIcon,
  FileText,
  ShoppingCart,
  Wallet,
  Landmark,
  Receipt,
  BarChart3,
  History,
  FileMinus,
  Undo2,
  Banknote,
  KeyRound,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { changeActionPassword } from "@/lib/actionPassword";
import { useMobileTabSettings } from "@/hooks/useMobileTabSettings";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
  { to: "/parties", label: "Parties", icon: Users },
  { to: "/items", label: "Items", icon: Package },
  { to: "/assets", label: "Assets", icon: ImageIcon },
  { to: "/invoices", label: "Sales", icon: FileText },
  { to: "/credit-notes", label: "Credit Notes", icon: FileMinus },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/purchase-returns", label: "Purchase Returns", icon: Undo2 },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/accounts", label: "Bank Accounts", icon: Landmark },
  { to: "/cash", label: "Cash", icon: Banknote },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/audit", label: "Audit", icon: History },
] as const;

export function AppSidebar() {
  const { hiddenTabs, hydrated, isNative, saveHiddenTabs } = useMobileTabSettings();
  const { isAdmin } = useAuth();
  const [showCustomize, setShowCustomize] = useState(false);

  const visibleLinks = useMemo(
    () => (isNative ? navLinks.filter((l) => !hiddenTabs[l.to]) : navLinks),
    [hiddenTabs, isNative],
  );

  const toggleTab = async (to: string) => {
    if (to === "/") return;
    const next = { ...hiddenTabs };
    if (next[to]) delete next[to];
    else next[to] = true;
    try {
      await saveHiddenTabs(next);
      toast.success("APK tabs updated");
    } catch {
      toast.error("Failed to update APK tabs");
    }
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <Link to="/" className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl primary-gradient primary-glow">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">QOBOX</span>
          <span className="text-[10px] text-sidebar-foreground/60">
            Invoicing · Billing · Accounting
          </span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
        {visibleLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className={cn(
                "hover-lift group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
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
        {!isNative && isAdmin ? (
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-sidebar-foreground/20 px-2 py-1 text-[11px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-60"
            disabled={!hydrated}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Customize APK tabs
          </button>
        ) : null}
        {!isNative && isAdmin && showCustomize ? (
          <div className="mb-2 rounded-md border border-sidebar-foreground/20 bg-sidebar-accent/40 p-2">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              Show in APK sidebar
            </p>
            <div className="space-y-1">
              {navLinks.map((l) => (
                <label
                  key={`pref-${l.to}`}
                  className="flex items-center gap-1.5 text-[11px] text-sidebar-foreground/80"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenTabs[l.to]}
                    onChange={() => void toggleTab(l.to)}
                    disabled={l.to === "/"}
                    className="h-3 w-3 accent-primary"
                  />
                  {l.label}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => {
            changeActionPassword();
          }}
          className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-sidebar-foreground/20 px-2 py-1 text-[11px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <KeyRound className="h-3 w-3" />
          Change security PIN
        </button>
        <br />© {new Date().getFullYear()} QOBOX
      </div>
    </aside>
  );
}
