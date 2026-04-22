import { createFileRoute } from "@tanstack/react-router";
import { BusinessForm } from "@/components/business/BusinessForm";

export const Route = createFileRoute("/businesses/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Business — Invoicing, Billing, Accounting" },
      {
        name: "description",
        content: "Update business details, addresses, tax info and branding.",
      },
    ],
  }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  return <BusinessForm mode="edit" businessId={id} />;
}
