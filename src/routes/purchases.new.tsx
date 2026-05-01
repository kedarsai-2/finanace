import { createFileRoute } from "@tanstack/react-router";
import { PurchaseForm } from "@/components/purchase/PurchaseForm";

export const Route = createFileRoute("/purchases/new")({
  head: () => ({
    meta: [
      { title: "New Purchase - QOBOX" },
      {
        name: "description",
        content: "Record a new purchase bill from a supplier with items, tax, and totals.",
      },
    ],
  }),
  component: () => <PurchaseForm mode="new" />,
});
