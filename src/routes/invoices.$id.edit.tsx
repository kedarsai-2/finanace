import { createFileRoute } from "@tanstack/react-router";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";

export const Route = createFileRoute("/invoices/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Invoice" },
      {
        name: "description",
        content: "Update an invoice that is still within the editable window.",
      },
    ],
  }),
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { id } = Route.useParams();
  return <InvoiceForm mode="edit" invoiceId={id} />;
}
