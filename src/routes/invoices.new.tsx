import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "New Sale - QOBOX" },
      {
        name: "description",
        content: "Create a new sale with items, tax, and payment terms.",
      },
    ],
  }),
  component: () => <InvoiceForm mode="new" />,
});
