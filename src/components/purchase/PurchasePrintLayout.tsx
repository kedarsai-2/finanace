import { format } from "date-fns";
import type { Business } from "@/types/business";
import type { Party } from "@/types/party";
import type { Purchase } from "@/types/purchase";
import { lineMath } from "@/types/invoice";
import { formatCurrency } from "@/hooks/useParties";

interface Props {
  purchase: Purchase;
  business?: Business;
  party?: Party;
}

/**
 * Print-friendly purchase / bill layout. A4, slate palette, theme-independent.
 */
export function PurchasePrintLayout({ purchase, business, party }: Props) {
  const intraState =
    !!purchase.businessState &&
    !!purchase.partyState &&
    purchase.businessState === purchase.partyState;
  const currency = business?.currency ?? "INR";

  return (
    <div
      className="invoice-print mx-auto bg-white text-slate-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm",
        boxSizing: "border-box",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ---------- Letterhead ---------- */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div className="flex items-start gap-4">
          {business?.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={`${business.name} logo`}
              className="h-16 w-16 rounded-md object-contain"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-slate-900 text-2xl font-bold text-white">
              {(business?.name ?? "B").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold leading-tight">
              {business?.name ?? "Your Business"}
            </h1>
            {business?.ownerName && (
              <p className="text-sm text-slate-600">{business.ownerName}</p>
            )}
            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              {[business?.billingAddress?.line1, business?.billingAddress?.line2]
                .filter(Boolean)
                .join(", ")}
              {(business?.city || business?.state) && (
                <div>
                  {[business?.city, business?.state, business?.billingAddress?.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
              <div className="mt-1 space-x-3">
                {business?.mobile && <span>📞 {business.mobile}</span>}
                {business?.email && <span>✉ {business.email}</span>}
              </div>
              {business?.gstNumber && (
                <div className="mt-1 font-mono">GSTIN: {business.gstNumber}</div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Purchase Bill
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-tight">
            {purchase.number}
          </p>
          <dl className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex justify-end gap-4">
              <dt>Date</dt>
              <dd className="font-medium text-slate-900">
                {format(new Date(purchase.date), "dd MMM yyyy")}
              </dd>
            </div>
            {purchase.dueDate && (
              <div className="flex justify-end gap-4">
                <dt>Due</dt>
                <dd className="font-medium text-slate-900">
                  {format(new Date(purchase.dueDate), "dd MMM yyyy")}
                </dd>
              </div>
            )}
            <div className="flex justify-end gap-4">
              <dt>Status</dt>
              <dd className="font-medium uppercase text-slate-900">
                {purchase.status}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ---------- Supplier ---------- */}
      <section className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Supplier
          </p>
          <p className="mt-1 text-base font-bold">{purchase.partyName}</p>
          {party && (
            <div className="mt-1 text-xs leading-relaxed text-slate-700">
              {party.address?.line1 && <div>{party.address.line1}</div>}
              <div>
                {[party.address?.city ?? party.city, party.state, party.address?.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {party.mobile && <div className="mt-1">📞 {party.mobile}</div>}
              {party.gstNumber && (
                <div className="mt-1 font-mono">GSTIN: {party.gstNumber}</div>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Place of supply
          </p>
          <p className="mt-1 text-sm font-medium">
            {purchase.partyState ?? "—"}
          </p>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            GST type
          </p>
          <p className="mt-1 text-sm font-medium">
            {intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}
          </p>
        </div>
      </section>

      {/* ---------- Items ---------- */}
      <section className="mt-6">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="w-10 px-2 py-2 text-left font-semibold">#</th>
              <th className="px-2 py-2 text-left font-semibold">Item</th>
              <th className="w-16 px-2 py-2 text-right font-semibold">Qty</th>
              <th className="w-14 px-2 py-2 text-left font-semibold">Unit</th>
              <th className="w-24 px-2 py-2 text-right font-semibold">Price</th>
              <th className="w-20 px-2 py-2 text-right font-semibold">Disc.</th>
              <th className="w-14 px-2 py-2 text-right font-semibold">Tax %</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.lines.map((line, idx) => {
              const m = lineMath(line);
              return (
                <tr key={line.id} className="border-b border-slate-200 align-top">
                  <td className="px-2 py-2 text-slate-500">{idx + 1}</td>
                  <td className="px-2 py-2 font-medium">{line.name}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{line.qty}</td>
                  <td className="px-2 py-2 text-slate-600">{line.unit}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatCurrency(line.rate, currency)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-600">
                    {line.discountValue > 0
                      ? line.discountKind === "percent"
                        ? `${line.discountValue}%`
                        : formatCurrency(line.discountValue, currency)
                      : "—"}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {line.taxPercent}%
                  </td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">
                    {formatCurrency(m.total, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ---------- Summary ---------- */}
      <section className="mt-6 grid grid-cols-2 gap-6">
        <div />
        <dl className="space-y-1.5 text-xs">
          <SummaryRow label="Subtotal" value={formatCurrency(purchase.subtotal, currency)} />
          {purchase.itemDiscountTotal > 0 && (
            <SummaryRow
              label="Line discounts"
              value={`− ${formatCurrency(purchase.itemDiscountTotal, currency)}`}
              muted
            />
          )}
          {purchase.overallDiscountAmount > 0 && (
            <SummaryRow
              label="Overall discount"
              value={`− ${formatCurrency(purchase.overallDiscountAmount, currency)}`}
              muted
            />
          )}
          <SummaryRow
            label="Taxable value"
            value={formatCurrency(purchase.taxableValue, currency)}
          />
          {intraState ? (
            <>
              <SummaryRow label="CGST (Input)" value={formatCurrency(purchase.cgst, currency)} muted />
              <SummaryRow label="SGST (Input)" value={formatCurrency(purchase.sgst, currency)} muted />
            </>
          ) : (
            <SummaryRow label="IGST (Input)" value={formatCurrency(purchase.igst, currency)} muted />
          )}
          <div className="my-1 border-t border-slate-300" />
          <div className="flex items-baseline justify-between gap-6 bg-slate-900 px-3 py-2 text-white">
            <dt className="text-sm font-semibold">Grand total</dt>
            <dd className="text-lg font-bold tabular-nums">
              {formatCurrency(purchase.total, currency)}
            </dd>
          </div>
        </dl>
      </section>

      {/* ---------- Notes / Terms ---------- */}
      <section className="mt-8 grid grid-cols-2 gap-6 text-xs">
        <div className="space-y-3">
          {purchase.notes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{purchase.notes}</p>
            </div>
          )}
          {purchase.terms && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Terms &amp; conditions
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{purchase.terms}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-end">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              For {business?.name ?? "Your Business"}
            </p>
            <div className="mt-10 w-56 border-t border-slate-400 pt-1 text-[10px] uppercase tracking-wider text-slate-500">
              Authorised signatory
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">
        This is a system-generated purchase bill.
      </footer>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className={muted ? "text-slate-500" : "text-slate-700"}>{label}</dt>
      <dd
        className={
          "tabular-nums " + (muted ? "text-slate-500" : "font-medium text-slate-900")
        }
      >
        {value}
      </dd>
    </div>
  );
}
