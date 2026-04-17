import { createFileRoute } from "@tanstack/react-router";
import { PurchaseForm } from "@/components/purchase/PurchaseForm";

export const Route = createFileRoute("/purchases/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Purchase" },
      { name: "description", content: "Update a purchase that is still within the editable window." },
    ],
  }),
  component: EditPurchasePage,
});

function EditPurchasePage() {
  const { id } = Route.useParams();
  return <PurchaseForm mode="edit" purchaseId={id} />;
}
