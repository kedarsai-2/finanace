import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
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
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { changeActionPassword } from "@/lib/actionPassword";
import { useMobileTabSettings } from "@/hooks/useMobileTabSettings";
import { useAuth } from "@/hooks/useAuth";
import { USE_BACKEND } from "@/lib/flags";
import { canAccessPath } from "@/lib/rbac";

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
  { to: "/role-access", label: "Role Access", icon: ShieldCheck },
] as const;

export function AppSidebar() {
  const { hiddenTabs } = useMobileTabSettings();
  const { isAuthed, isAdmin, authorities } = useAuth();

  const permittedLinks = useMemo(
    () =>
      USE_BACKEND ? navLinks.filter((l) => canAccessPath(l.to, authorities, isAuthed)) : navLinks,
    [authorities, isAuthed],
  );
  const visibleLinks = useMemo(
    () => permittedLinks.filter((l) => isAdmin || l.to === "/role-access" || !hiddenTabs[l.to]),
    [hiddenTabs, isAdmin, permittedLinks],
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-linear-to-b from-[#6892F6] via-[#6f82fb] to-[#7A62FF] text-sidebar-foreground md:flex">
      <Link to="/" className="flex h-20 items-center justify-center border-b border-white/25 px-4">
        <img
          src="/qobox-wordmark.png"
          alt="QOBOX"
          className="h-11 w-auto max-w-[190px] bg-transparent object-contain mix-blend-multiply"
        />
      </Link>

      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
        {visibleLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to as never}
              activeOptions={{ exact: l.to === "/" }}
              className={cn(
                "hover-lift group relative flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-white/10 hover:text-sidebar-foreground",
              )}
              activeProps={{
                className:
                  "bg-gradient-to-r from-white/30 via-white/12 to-transparent text-sidebar-foreground shadow-[inset_2px_0_0_0_rgba(255,255,255,0.55)]",
              }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-base leading-6">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 text-[10px] text-sidebar-foreground/40">
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
