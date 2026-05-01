import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";
import { getJwt, getSubjectFromToken } from "@/lib/auth";
import {
  RBAC_MODULES,
  readAuthorityForModule,
  writeAuthorityForModule,
  type RbacModuleKey,
} from "@/lib/rbac";

export const Route = createFileRoute("/role-access")({
  head: () => ({
    meta: [{ title: "Role Access - QOBOX" }],
  }),
  component: RoleAccessPage,
});

type AdminUser = {
  id?: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  activated?: boolean;
  langKey?: string;
  authorities?: string[];
  mobileHiddenTabs?: string | null;
};
type AuthorityRecord = { name: string };

const TAB_OPTIONS = [
  { path: "/", label: "Dashboard", pathToModule: "dashboard" as const },
  { path: "/businesses", label: "Businesses", pathToModule: "businesses" as const },
  { path: "/parties", label: "Parties", pathToModule: "parties" as const },
  { path: "/items", label: "Items", pathToModule: "items" as const },
  { path: "/assets", label: "Assets", pathToModule: "assets" as const },
  { path: "/invoices", label: "Sales", pathToModule: "sales" as const },
  { path: "/credit-notes", label: "Credit Notes", pathToModule: "sales" as const },
  { path: "/purchases", label: "Purchases", pathToModule: "purchases" as const },
  { path: "/purchase-returns", label: "Purchase Returns", pathToModule: "purchases" as const },
  { path: "/payments", label: "Payments", pathToModule: "payments" as const },
  { path: "/accounts", label: "Bank Accounts", pathToModule: "accounts" as const },
  { path: "/cash", label: "Cash", pathToModule: "accounts" as const },
  { path: "/expenses", label: "Expenses", pathToModule: "expenses" as const },
  { path: "/reports", label: "Reports", pathToModule: "reports" as const },
  { path: "/audit", label: "Audit", pathToModule: "audit" as const },
  { path: "/role-access", label: "Role Access", pathToModule: "role_access" as const },
] as const;

const ROLE_OPTIONS = ["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_USER", "ROLE_VIEWER"] as const;
const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: "Admin",
  ROLE_MANAGER: "Manager",
  ROLE_USER: "User",
  ROLE_VIEWER: "Viewer",
};

function parseHiddenTabs(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function roleLabel(role: string) {
  return ROLE_LABEL[role] ?? role;
}

function roleTemplate(role: string): {
  read: Record<RbacModuleKey, boolean>;
  write: Record<RbacModuleKey, boolean>;
} {
  const read = {} as Record<RbacModuleKey, boolean>;
  const write = {} as Record<RbacModuleKey, boolean>;
  for (const module of RBAC_MODULES) {
    read[module.key] = false;
    write[module.key] = false;
  }

  if (role === "ROLE_ADMIN") {
    for (const module of RBAC_MODULES) {
      read[module.key] = true;
      write[module.key] = true;
    }
    return { read, write };
  }

  if (role === "ROLE_MANAGER" || role === "ROLE_USER") {
    for (const module of RBAC_MODULES) {
      if (module.key === "audit" || module.key === "role_access") continue;
      read[module.key] = true;
      write[module.key] = true;
    }
    return { read, write };
  }

  // ROLE_VIEWER
  for (const module of RBAC_MODULES) {
    if (module.key === "audit" || module.key === "role_access") continue;
    read[module.key] = true;
  }
  return { read, write };
}

function RoleAccessPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [authorities, setAuthorities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLogin, setSelectedLogin] = useState<string>("");

  const [newLogin, setNewLogin] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRole, setNewRole] = useState<string>("ROLE_USER");
  const currentLogin = getSubjectFromToken(getJwt());

  const selectedUser = useMemo(
    () => users.find((u) => u.login === selectedLogin) ?? null,
    [users, selectedLogin],
  );
  const selectedIsBuiltInAdmin = selectedUser?.login === "admin";
  const [selectedRole, setSelectedRole] = useState<string>("ROLE_USER");
  const [selectedHiddenTabs, setSelectedHiddenTabs] = useState<Record<string, true>>({});
  const [moduleRead, setModuleRead] = useState<Record<RbacModuleKey, boolean>>(
    {} as Record<RbacModuleKey, boolean>,
  );
  const [moduleWrite, setModuleWrite] = useState<Record<RbacModuleKey, boolean>>(
    {} as Record<RbacModuleKey, boolean>,
  );

  const effectiveRoleOptions = useMemo(() => {
    const set = new Set(authorities.filter((a) => a.startsWith("ROLE_")));
    for (const r of ROLE_OPTIONS) set.add(r);
    return Array.from(set).sort();
  }, [authorities]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, authoritiesRes] = await Promise.all([
        apiFetch<AdminUser[]>("/api/admin/users?size=200&sort=login,asc"),
        apiFetch<AuthorityRecord[]>("/api/authorities"),
      ]);
      setUsers(usersRes);
      setAuthorities(authoritiesRes.map((a) => a.name));
      if (!selectedLogin && usersRes.length) setSelectedLogin(usersRes[0].login);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load user access data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    const role =
      selectedUser.authorities?.find((a) => a.startsWith("ROLE_")) ??
      selectedUser.authorities?.[0] ??
      "ROLE_USER";
    setSelectedRole(role);
    const map: Record<string, true> = {};
    for (const tab of parseHiddenTabs(selectedUser.mobileHiddenTabs)) map[tab] = true;
    setSelectedHiddenTabs(map);
    const readMap = {} as Record<RbacModuleKey, boolean>;
    const writeMap = {} as Record<RbacModuleKey, boolean>;
    for (const module of RBAC_MODULES) {
      const canRead =
        !!selectedUser.authorities?.includes(readAuthorityForModule(module.key)) ||
        !!selectedUser.authorities?.includes(writeAuthorityForModule(module.key));
      const canWrite = !!selectedUser.authorities?.includes(writeAuthorityForModule(module.key));
      readMap[module.key] = canRead;
      writeMap[module.key] = canWrite;
    }
    setModuleRead(readMap);
    setModuleWrite(writeMap);
  }, [selectedUser]);

  const toggleTab = (path: string, checked: boolean) => {
    setSelectedHiddenTabs((prev) => {
      const next = { ...prev };
      if (checked) next[path] = true;
      else delete next[path];
      return next;
    });
  };

  const createUser = async () => {
    if (!newLogin.trim()) {
      toast.error("Login is required");
      return;
    }
    setSaving(true);
    try {
      const tpl = roleTemplate(newRole);
      const moduleAuthorities = RBAC_MODULES.flatMap((module) => {
        const perms: string[] = [];
        if (tpl.read[module.key]) perms.push(readAuthorityForModule(module.key));
        if (tpl.write[module.key]) perms.push(writeAuthorityForModule(module.key));
        return perms;
      });
      const hiddenTabs = TAB_OPTIONS.filter((tab) => !tpl.read[tab.pathToModule]).map(
        (tab) => tab.path,
      );
      const neededAuthorities = [newRole, ...moduleAuthorities];
      for (const authority of neededAuthorities) {
        if (authorities.includes(authority)) continue;
        await apiFetch("/api/authorities", {
          method: "POST",
          body: JSON.stringify({ name: authority }),
        }).catch(() => {
          // ignore already-existing race/errors, PUT will still validate.
        });
      }
      await apiFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          login: newLogin.trim(),
          email: newEmail.trim() || undefined,
          firstName: newFirstName.trim() || undefined,
          lastName: newLastName.trim() || undefined,
          langKey: "en",
          activated: true,
          authorities: neededAuthorities,
          mobileHiddenTabs: JSON.stringify(hiddenTabs),
        }),
      });
      toast.success("User created");
      const createdLogin = newLogin.trim();
      setNewLogin("");
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setNewRole("ROLE_USER");
      await loadAll();
      setSelectedLogin(createdLogin);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const saveAccess = async () => {
    if (!selectedUser) return;
    if (selectedIsBuiltInAdmin && selectedRole !== "ROLE_ADMIN") {
      toast.error("Built-in admin role cannot be changed.");
      return;
    }
    setSaving(true);
    try {
      const moduleAuthorities = RBAC_MODULES.flatMap((module) => {
        const perms: string[] = [];
        if (moduleRead[module.key]) perms.push(readAuthorityForModule(module.key));
        if (moduleWrite[module.key]) perms.push(writeAuthorityForModule(module.key));
        return perms;
      });
      const neededAuthorities = [selectedRole, ...moduleAuthorities];
      for (const authority of neededAuthorities) {
        if (authorities.includes(authority)) continue;
        await apiFetch("/api/authorities", {
          method: "POST",
          body: JSON.stringify({ name: authority }),
        }).catch(() => {
          // Ignore if authority already exists or cannot be created immediately.
        });
      }
      await apiFetch("/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({
          ...selectedUser,
          authorities: neededAuthorities,
          mobileHiddenTabs: JSON.stringify(Object.keys(selectedHiddenTabs)),
        }),
      });
      toast.success("Access updated");
      await loadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update access");
    } finally {
      setSaving(false);
    }
  };

  const applyRoleTemplate = () => {
    const tpl = roleTemplate(selectedRole);
    setModuleRead(tpl.read);
    setModuleWrite(tpl.write);
    const nextHidden: Record<string, true> = {};
    for (const tab of TAB_OPTIONS) {
      if (!tpl.read[tab.pathToModule]) nextHidden[tab.path] = true;
    }
    setSelectedHiddenTabs(nextHidden);
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    if (currentLogin && selectedUser.login === currentLogin) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (!confirm(`Delete user "${selectedUser.login}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(selectedUser.login)}`, {
        method: "DELETE",
      });
      toast.success("User deleted");
      const deletedLogin = selectedUser.login;
      await loadAll();
      if (selectedLogin === deletedLogin) {
        setSelectedLogin((prev) => (prev === deletedLogin ? "" : prev));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Role Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create users, assign roles, and control which sidebar tabs each user can access.
        </p>
      </header>

      <section className="mb-5 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Create user</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            placeholder="Login *"
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            placeholder="First name"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
          />
          <Input
            placeholder="Last name"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
          />
          <select
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            {effectiveRoleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3">
          <Button onClick={() => void createUser()} disabled={saving}>
            Create user
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div>
            <Label>Users</Label>
            <div className="mt-2 max-h-[420px] overflow-y-auto rounded-lg border border-border">
              {loading ? (
                <p className="p-3 text-sm text-muted-foreground">Loading users…</p>
              ) : users.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No users</p>
              ) : (
                users.map((u) => (
                  <button
                    key={u.login}
                    type="button"
                    onClick={() => setSelectedLogin(u.login)}
                    className={
                      "flex w-full items-start justify-between border-b border-border px-3 py-2 text-left text-sm last:border-b-0 " +
                      (u.login === selectedLogin ? "bg-primary/8" : "hover:bg-muted/40")
                    }
                  >
                    <span className="truncate">{u.login}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleLabel(u.authorities?.find((a) => a.startsWith("ROLE_")) ?? "ROLE_USER")}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            {!selectedUser ? (
              <p className="text-sm text-muted-foreground">Select a user to manage access.</p>
            ) : (
              <>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1 inline-block">Login</Label>
                    <Input value={selectedUser.login} disabled />
                  </div>
                  <div>
                    <Label className="mb-1 inline-block">Role</Label>
                    <select
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={selectedIsBuiltInAdmin}
                    >
                      {effectiveRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-border p-3">
                  <Label className="mb-2 inline-block">Module permissions</Label>
                  <div className="mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyRoleTemplate}
                      disabled={selectedIsBuiltInAdmin}
                    >
                      Apply role template
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {RBAC_MODULES.map((module) => (
                      <div
                        key={module.key}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <span className="text-sm">{module.label}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5">
                            <Checkbox
                              checked={!!moduleRead[module.key]}
                              disabled={selectedIsBuiltInAdmin}
                              onCheckedChange={(v) => {
                                const checked = v === true;
                                setModuleRead((prev) => ({ ...prev, [module.key]: checked }));
                                if (!checked) {
                                  setModuleWrite((prev) => ({ ...prev, [module.key]: false }));
                                }
                              }}
                            />
                            Read
                          </label>
                          <label className="flex items-center gap-1.5">
                            <Checkbox
                              checked={!!moduleWrite[module.key]}
                              disabled={selectedIsBuiltInAdmin}
                              onCheckedChange={(v) => {
                                const checked = v === true;
                                setModuleWrite((prev) => ({ ...prev, [module.key]: checked }));
                                if (checked) {
                                  setModuleRead((prev) => ({ ...prev, [module.key]: true }));
                                }
                              }}
                            />
                            Write
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 inline-block">Allowed tabs</Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Uncheck tabs to hide access for this user.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {TAB_OPTIONS.map((tab) => {
                      const checked = !selectedHiddenTabs[tab.path];
                      return (
                        <label
                          key={tab.path}
                          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={selectedIsBuiltInAdmin}
                            onCheckedChange={(v) => {
                              const isChecked = v === true;
                              // hidden tabs are stored as deny-list
                              toggleTab(tab.path, !isChecked);
                              if (!isChecked) {
                                setModuleRead((prev) => ({ ...prev, [tab.pathToModule]: false }));
                                setModuleWrite((prev) => ({ ...prev, [tab.pathToModule]: false }));
                              } else {
                                setModuleRead((prev) => ({ ...prev, [tab.pathToModule]: true }));
                              }
                            }}
                          />
                          <span>{tab.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={() => void saveAccess()} disabled={saving}>
                    Save access
                  </Button>
                  <Button
                    variant="destructive"
                    className="ml-2"
                    onClick={() => void deleteUser()}
                    disabled={
                      saving ||
                      selectedIsBuiltInAdmin ||
                      (currentLogin ? selectedUser.login === currentLogin : false)
                    }
                  >
                    Delete user
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
