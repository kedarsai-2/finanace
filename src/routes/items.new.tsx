import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/item/ItemForm";

export const Route = createFileRoute("/items/new")({
  head: () => ({
    meta: [
      { title: "Add Item - QOBOX" },
      {
        name: "description",
        content: "Create a new product or service with pricing, tax and unit.",
      },
    ],
  }),
  component: () => <ItemForm mode="new" />,
});
