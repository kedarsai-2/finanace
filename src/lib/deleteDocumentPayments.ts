import { asyncPool, BULK_IO_CONCURRENCY } from "@/lib/asyncPool";
import { paymentsSolelyAllocatedToDocument } from "@/lib/paymentAccounts";
import type { Payment } from "@/types/payment";

/** Remove ledger payments tied only to this document (CN refund, purchase return receipt, etc.). */
export async function deleteLinkedDocumentPayments(
  allPayments: Payment[],
  docId: string,
  docNumber: string,
  removePayment: (id: string) => Promise<void>,
): Promise<void> {
  const linked = paymentsSolelyAllocatedToDocument(allPayments, docId, docNumber);
  await asyncPool(BULK_IO_CONCURRENCY, linked, (p) => removePayment(p.id));
}
