import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "New Invoice — Sales" },
      { name: "description", content: "Create a new sales invoice with items, tax, and payment terms." },
    ],
  }),
  component: () => <InvoiceForm mode="new" />,
});
