import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/items/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Item" }] }),
  component: EditItemPage,
});

function EditItemPage() {
  const { id } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Edit Item</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Editor for item <span className="font-mono">{id}</span> coming next.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/items">Back to Items</Link>
      </Button>
    </div>
  );
}
