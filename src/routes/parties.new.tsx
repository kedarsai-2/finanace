import { createFileRoute } from "@tanstack/react-router";
import { PartyForm } from "@/components/party/PartyForm";

export const Route = createFileRoute("/parties/new")({
  head: () => ({
    meta: [
      { title: "Add Party - QOBOX" },
      { name: "description", content: "Create a new party with opening balance and credit terms." },
    ],
  }),
  component: () => <PartyForm mode="new" />,
});
