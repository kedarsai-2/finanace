import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/item/ItemForm";

export const Route = createFileRoute("/assets/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Asset - QOBOX" },
      { name: "description", content: "Update asset details, pricing, tax and unit of measure." },
    ],
  }),
  component: EditAssetPage,
});

function EditAssetPage() {
  const { id } = Route.useParams();
  return <ItemForm mode="edit" itemId={id} context="assets" />;
}
