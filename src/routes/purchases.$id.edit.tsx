import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PurchaseForm } from "@/components/purchase/PurchaseForm";
import { verifyActionPassword } from "@/lib/actionPassword";

export const Route = createFileRoute("/purchases/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Purchase - QOBOX" },
      {
        name: "description",
        content: "Update a purchase that is still within the editable window.",
      },
    ],
  }),
  component: EditPurchasePage,
});

function EditPurchasePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (verifyActionPassword()) return;
    navigate({ to: "/purchases/$id", params: { id } });
  }, [navigate, id]);

  return <PurchaseForm mode="edit" purchaseId={id} />;
}
