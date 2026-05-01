export type AppRole = "admin" | "manager" | "viewer" | "guest";
export type AppPermission = "app.read" | "app.write" | "audit.read" | "user.manage";
export type RbacModuleKey =
  | "dashboard"
  | "businesses"
  | "parties"
  | "items"
  | "assets"
  | "sales"
  | "purchases"
  | "payments"
  | "accounts"
  | "expenses"
  | "reports"
  | "audit"
  | "role_access";

export const RBAC_MODULES: Array<{ key: RbacModuleKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "businesses", label: "Businesses" },
  { key: "parties", label: "Parties" },
  { key: "items", label: "Items" },
  { key: "assets", label: "Assets" },
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "payments", label: "Payments" },
  { key: "accounts", label: "Accounts & Cash" },
  { key: "expenses", label: "Expenses" },
  { key: "reports", label: "Reports" },
  { key: "audit", label: "Audit" },
  { key: "role_access", label: "Role Access" },
];

export function readAuthorityForModule(module: RbacModuleKey) {
  return `PERM_${module.toUpperCase()}_READ`;
}

export function writeAuthorityForModule(module: RbacModuleKey) {
  return `PERM_${module.toUpperCase()}_WRITE`;
}

export function editAuthorityForModule(module: RbacModuleKey) {
  return `PERM_${module.toUpperCase()}_EDIT`;
}

export function deleteAuthorityForModule(module: RbacModuleKey) {
  return `PERM_${module.toUpperCase()}_DELETE`;
}

export function resolveRole(authorities: string[]): AppRole {
  if (authorities.includes("ROLE_ADMIN")) return "admin";
  if (authorities.includes("ROLE_VIEWER")) return "viewer";
  if (authorities.includes("ROLE_MANAGER") || authorities.includes("ROLE_USER")) return "manager";
  return "guest";
}

export function hasPermission(role: AppRole, permission: AppPermission): boolean {
  switch (role) {
    case "admin":
      return true;
    case "manager":
      return permission === "app.read" || permission === "app.write";
    case "viewer":
      return permission === "app.read";
    default:
      return false;
  }
}

function moduleForPath(pathname: string): RbacModuleKey {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/role-access")) return "role_access";
  if (pathname.startsWith("/audit")) return "audit";
  if (pathname.startsWith("/businesses")) return "businesses";
  if (pathname.startsWith("/parties")) return "parties";
  if (pathname.startsWith("/items")) return "items";
  if (pathname.startsWith("/assets")) return "assets";
  if (pathname.startsWith("/invoices") || pathname.startsWith("/credit-notes")) return "sales";
  if (pathname.startsWith("/purchases") || pathname.startsWith("/purchase-returns"))
    return "purchases";
  if (pathname.startsWith("/payments")) return "payments";
  if (pathname.startsWith("/accounts") || pathname.startsWith("/cash")) return "accounts";
  if (pathname.startsWith("/expenses") || pathname.startsWith("/categories/expense"))
    return "expenses";
  if (pathname.startsWith("/reports")) return "reports";
  return "dashboard";
}

export function canAccessPath(pathname: string, authorities: string[], isAuthed: boolean): boolean {
  // Public routes
  if (pathname === "/login" || pathname === "/register" || pathname === "/forbidden") return true;
  if (!isAuthed) return false;
  if (authorities.includes("ROLE_ADMIN")) return true;
  const isCreatePath =
    pathname.endsWith("/new") || pathname === "/accounts/transfer" || pathname === "/payments/new";
  const isEditPath = pathname.endsWith("/edit");
  const module = moduleForPath(pathname);
  const hasCustomModulePerms = authorities.some((a) => a.startsWith("PERM_"));
  if (!hasCustomModulePerms) {
    const role = resolveRole(authorities);
    if (module === "role_access") return hasPermission(role, "user.manage");
    if (module === "audit") return hasPermission(role, "audit.read");
    return hasPermission(role, isCreatePath || isEditPath ? "app.write" : "app.read");
  }

  const canRead =
    authorities.includes(readAuthorityForModule(module)) ||
    authorities.includes(writeAuthorityForModule(module)) ||
    authorities.includes(editAuthorityForModule(module)) ||
    authorities.includes(deleteAuthorityForModule(module));
  const canWrite = authorities.includes(writeAuthorityForModule(module));
  const canEdit =
    authorities.includes(editAuthorityForModule(module)) ||
    // Backward compatibility for older role mappings
    authorities.includes(writeAuthorityForModule(module));
  if (isCreatePath) return canWrite;
  if (isEditPath) return canEdit;
  return canRead;
}
