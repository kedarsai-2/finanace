import { createFileRoute } from "@tanstack/react-router";
import { BusinessForm } from "@/components/business/BusinessForm";

export const Route = createFileRoute("/businesses/new")({
  head: () => ({
    meta: [
      { title: "Add Business — Invoicing, Billing, Accounting" },
      {
        name: "description",
        content: "Create a new business profile with billing, tax and branding details.",
      },
    ],
  }),
  component: () => <BusinessForm mode="new" />,
});
