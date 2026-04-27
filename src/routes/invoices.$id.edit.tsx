import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { verifyActionPassword } from "@/lib/actionPassword";

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
  const navigate = useNavigate();

  useEffect(() => {
    if (verifyActionPassword()) return;
    navigate({ to: "/invoices/$id", params: { id } });
  }, [navigate, id]);

  return <InvoiceForm mode="edit" invoiceId={id} />;
}
