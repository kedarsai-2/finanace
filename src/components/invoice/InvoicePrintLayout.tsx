import { format } from "date-fns";
import type { Business } from "@/types/business";
import type { Party } from "@/types/party";
import type { Invoice } from "@/types/invoice";
import { lineMath } from "@/types/invoice";
import { formatCurrency } from "@/hooks/useParties";

interface Props {
  invoice: Invoice;
  business?: Business;
  party?: Party;
}

/**
 * Print-friendly invoice layout.
 *
 * Designed for A4 paper. All colours come from a slimmed-down inline palette
 * to guarantee the same look on screen and on paper, regardless of the user's
 * theme. The container forces a white background + dark text so dark-mode
 * users get a clean print preview.
 */
export function InvoicePrintLayout({ invoice, business, party }: Props) {
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const currency = business?.currency ?? "INR";

  return (
    <div
      className="invoice-print mx-auto bg-white text-slate-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm",
        boxSizing: "border-box",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
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
            {business?.ownerName && <p className="text-sm text-slate-600">{business.ownerName}</p>}
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
            Tax Invoice
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-tight">{invoice.number}</p>
          <dl className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex justify-end gap-4">
              <dt>Date</dt>
              <dd className="font-medium text-slate-900">
                {format(new Date(invoice.date), "dd MMM yyyy")}
              </dd>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-end gap-4">
                <dt>Due</dt>
                <dd className="font-medium text-slate-900">
                  {format(new Date(invoice.dueDate), "dd MMM yyyy")}
                </dd>
              </div>
            )}
            <div className="flex justify-end gap-4">
              <dt>Status</dt>
              <dd className="font-medium uppercase text-slate-900">{invoice.status}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ---------- Bill to / Ship to ---------- */}
      <section className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Bill to
          </p>
          <p className="mt-1 text-base font-bold">{invoice.partyName}</p>
          {party && (
            <div className="mt-1 text-xs leading-relaxed text-slate-700">
              {party.address?.line1 && <div>{party.address.line1}</div>}
              <div>
                {[party.address?.city ?? party.city, party.state, party.address?.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {party.mobile && <div className="mt-1">📞 {party.mobile}</div>}
              {party.gstNumber && <div className="mt-1 font-mono">GSTIN: {party.gstNumber}</div>}
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Place of supply
          </p>
          <p className="mt-1 text-sm font-medium">{invoice.partyState ?? "—"}</p>
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
              <th className="w-24 px-2 py-2 text-right font-semibold">Rate</th>
              <th className="w-20 px-2 py-2 text-right font-semibold">Disc.</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, idx) => {
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
        <div className="text-xs text-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Amount in words
          </p>
          <p className="mt-1 font-medium capitalize">{amountInWords(invoice.total, currency)}</p>
        </div>
        <dl className="space-y-1.5 text-xs">
          <SummaryRow label="Subtotal" value={formatCurrency(invoice.subtotal, currency)} />
          {invoice.itemDiscountTotal > 0 && (
            <SummaryRow
              label="Line discounts"
              value={`− ${formatCurrency(invoice.itemDiscountTotal, currency)}`}
              muted
            />
          )}
          {invoice.overallDiscountAmount > 0 && (
            <SummaryRow
              label="Overall discount"
              value={`− ${formatCurrency(invoice.overallDiscountAmount, currency)}`}
              muted
            />
          )}
          <div className="my-1 border-t border-slate-300" />
          <div className="flex items-baseline justify-between gap-6 bg-slate-900 px-3 py-2 text-white">
            <dt className="text-sm font-semibold">Grand total</dt>
            <dd className="text-lg font-bold tabular-nums">
              {formatCurrency(invoice.total, currency)}
            </dd>
          </div>
          {invoice.paidAmount > 0 && (
            <>
              <SummaryRow label="Paid" value={formatCurrency(invoice.paidAmount, currency)} muted />
              <SummaryRow label="Balance due" value={formatCurrency(balance, currency)} emphasis />
            </>
          )}
        </dl>
      </section>

      {/* ---------- Notes / Terms / Sign ---------- */}
      <section className="mt-8 grid grid-cols-2 gap-6 text-xs">
        <div className="space-y-3">
          {invoice.notes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Terms &amp; conditions
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
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
        This is a system-generated invoice.
      </footer>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className={muted ? "text-slate-500" : "text-slate-700"}>{label}</dt>
      <dd
        className={
          "tabular-nums " +
          (emphasis
            ? "text-base font-bold text-slate-900"
            : muted
              ? "text-slate-500"
              : "font-medium text-slate-900")
        }
      >
        {value}
      </dd>
    </div>
  );
}

// ---------- Indian-style amount-in-words ----------------------------------

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return r === 0 ? `${ONES[h]} hundred` : `${ONES[h]} hundred ${below100(r)}`;
}

/** Indian numbering: lakh / crore. */
function intToWords(n: number): string {
  if (n === 0) return "zero";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const rest = n;
  const parts: string[] = [];
  if (crore) parts.push(`${below1000(crore)} crore`);
  if (lakh) parts.push(`${below100(lakh)} lakh`);
  if (thousand) parts.push(`${below100(thousand)} thousand`);
  if (rest) parts.push(below1000(rest));
  return parts.join(" ").trim();
}

function amountInWords(amount: number, currency: string): string {
  const safe = Math.max(0, Math.round(amount * 100) / 100);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);
  const unit = currency === "INR" ? "rupees" : currency.toLowerCase();
  const sub = currency === "INR" ? "paise" : "cents";
  const main = `${intToWords(rupees)} ${unit}`;
  return paise > 0 ? `${main} and ${below100(paise)} ${sub} only` : `${main} only`;
}
