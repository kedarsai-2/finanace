import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({ meta: [{ title: "Create Invoice" }] }),
  component: NewInvoicePage,
});

function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The Create Invoice form will be built next.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/invoices" search={{ q: "", status: "all", payment: "all", from: "", to: "" }}>
          Back to Invoices
        </Link>
      </Button>
    </div>
  );
}
