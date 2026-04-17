import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice Details" }] }),
  component: InvoiceDetailsPage,
});

function InvoiceDetailsPage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Invoice {id}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The invoice details view will be built next.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/invoices" search={{ q: "", status: "all", payment: "all", from: "", to: "" }}>
          Back to Invoices
        </Link>
      </Button>
    </div>
  );
}
