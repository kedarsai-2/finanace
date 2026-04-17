import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/items/new")({
  head: () => ({ meta: [{ title: "Add Item" }] }),
  component: NewItemPage,
});

function NewItemPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Add Item</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The Add / Edit Item form will be built next.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/items">Back to Items</Link>
      </Button>
    </div>
  );
}
