import { createFileRoute } from "@tanstack/react-router";
import { PartyForm } from "@/components/party/PartyForm";

export const Route = createFileRoute("/parties/new")({
  head: () => ({
    meta: [
      { title: "Add Party — Customers & Suppliers" },
      {
        name: "description",
        content: "Create a new customer or supplier with opening balance and credit terms.",
      },
    ],
  }),
  component: () => <PartyForm mode="new" />,
});
