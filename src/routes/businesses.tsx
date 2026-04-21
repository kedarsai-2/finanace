import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useBusinesses } from "@/hooks/useBusinesses";
import { BusinessCard } from "@/components/business/BusinessCard";
import type { Business } from "@/types/business";

export const Route = createFileRoute("/businesses")({
  head: () => ({
    meta: [
      { title: "Your Businesses — Invoicing, Billing, Accounting" },
      {
        name: "description",
        content:
          "Manage all your businesses in one place. Switch, edit, and organise GST profiles across locations.",
      },
    ],
  }),
  component: BusinessesRouteLayout,
});

const hasUnsavedWork = () => false;

function BusinessesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/businesses") return <Outlet />;
  return <BusinessesPage />;
}

function BusinessesPage() {
  const navigate = useNavigate();
  const { businesses, activeId, setActiveId, remove, hydrated } = useBusinesses();

  const [deleting, setDeleting] = useState<Business | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<Business | null>(null);

  const handleSelect = (b: Business) => {
    if (b.id === activeId) return;
    if (hasUnsavedWork()) {
      setPendingSwitch(b);
      return;
    }
    setActiveId(b.id);
    toast.success(`Switched to ${b.name}`);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const name = deleting.name;
    remove(deleting.id);
    setDeleting(null);
    toast.success(`Deleted ${name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      

      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Your Businesses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {hydrated
                ? `${businesses.length} ${businesses.length === 1 ? "business" : "businesses"} • Switch anytime`
                : "Loading…"}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/businesses/new">
              <Plus className="h-4 w-4" />
              Add Business
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-10">
        {hydrated && businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <Building2 className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No businesses added yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first business profile to start tracking invoices, GST and reports.
            </p>
            <Button asChild size="lg" className="mt-6 gap-2">
              <Link to="/businesses/new">
                <Plus className="h-4 w-4" />
                Add Your First Business
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                active={b.id === activeId}
                onSelect={() => handleSelect(b)}
                onEdit={() =>
                  navigate({ to: "/businesses/$id/edit", params: { id: b.id } })
                }
                onDelete={() => setDeleting(b)}
              />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.hasData
                ? "This business contains data. Are you sure? This action cannot be undone."
                : "This will permanently remove the business profile."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingSwitch}
        onOpenChange={(v) => !v && setPendingSwitch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved work in the current business. Switching will discard those changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSwitch) {
                  setActiveId(pendingSwitch.id);
                  toast.success(`Switched to ${pendingSwitch.name}`);
                }
                setPendingSwitch(null);
              }}
            >
              Switch anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
