import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/payment/PaymentForm";
import { usePayments } from "@/hooks/usePayments";
import { verifyActionPassword } from "@/lib/actionPassword";

export const Route = createFileRoute("/payments/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Payment - QOBOX" }] }),
  component: EditPaymentPage,
});

function EditPaymentPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { allPayments, hydrated } = usePayments(null);

  const payment = allPayments.find((p) => p.id === id);

  useEffect(() => {
    if (verifyActionPassword()) return;
    navigate({ to: "/payments", search: { dir: "all", from: "", to: "", account: "" } });
  }, [navigate]);

  if (!hydrated) return null;

  if (!payment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm font-medium">Payment not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/payments" search={{ dir: "all", from: "", to: "", account: "" }}>
            Back to payments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/payments" search={{ dir: "all", from: "", to: "", account: "" }}>
          <ArrowLeft className="h-4 w-4" /> Back to payments
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Editing payment
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Payment</h1>
      </header>
      <PaymentForm key={payment.id} initial={payment} />
    </div>
  );
}
