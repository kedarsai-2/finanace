import { useMemo } from "react";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useInvoices } from "@/hooks/useInvoices";
import { usePurchases } from "@/hooks/usePurchases";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useParties } from "@/hooks/useParties";
import { buildDashboardSnapshot } from "@/lib/aiContext";

/** Builds the JSON snapshot for the active business — used by AI features. */
export function useDashboardSnapshot() {
  const { businesses, activeId } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const { invoices } = useInvoices(activeId);
  const { purchases } = usePurchases(activeId);
  const { payments } = usePayments(activeId);
  const { expenses } = useExpenses(activeId);
  const { allParties } = useParties(activeId);

  return useMemo(
    () =>
      buildDashboardSnapshot({
        currency,
        invoices,
        purchases,
        payments,
        expenses,
        parties: allParties,
      }),
    [currency, invoices, purchases, payments, expenses, allParties],
  );
}
