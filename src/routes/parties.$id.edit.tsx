import { createFileRoute } from "@tanstack/react-router";
import { PartyForm } from "@/components/party/PartyForm";

export const Route = createFileRoute("/parties/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Party — Customers & Suppliers" },
      { name: "description", content: "Update party details, tax info, credit settings and opening balance." },
    ],
  }),
  component: EditPartyPage,
});

function EditPartyPage() {
  const { id } = Route.useParams();
  return <PartyForm mode="edit" partyId={id} />;
}
