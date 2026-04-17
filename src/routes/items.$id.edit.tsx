import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/item/ItemForm";

export const Route = createFileRoute("/items/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Item — Products & Services" },
      {
        name: "description",
        content: "Update item details, pricing, tax and unit of measure.",
      },
    ],
  }),
  component: EditItemPage,
});

function EditItemPage() {
  const { id } = Route.useParams();
  return <ItemForm mode="edit" itemId={id} />;
}
