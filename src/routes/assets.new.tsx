import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/item/ItemForm";

export const Route = createFileRoute("/assets/new")({
  head: () => ({
    meta: [
      { title: "Add Asset - QOBOX" },
      {
        name: "description",
        content: "Create a new asset (product-only) with pricing, tax and unit.",
      },
    ],
  }),
  component: () => <ItemForm mode="new" context="assets" />,
});
