import { format } from "date-fns";
import type { Business } from "@/types/business";
import type { Party } from "@/types/party";
import type { Invoice } from "@/types/invoice";
import { lineMath } from "@/types/invoice";
import { formatCurrency } from "@/hooks/useParties";
import type { Account } from "@/types/account";
import type { Payment } from "@/types/payment";
import { PAYMENT_MODE_LABEL } from "@/types/payment";

interface Props {
  invoice: Invoice;
  business?: Business;
  party?: Party;
  lastPayment?: Payment | null;
  payToAccount?: Account;
}

/**
 * Print-friendly invoice layout.
 *
 * Designed for A4 paper. All colours come from a slimmed-down inline palette
 * to guarantee the same look on screen and on paper, regardless of the user's
 * theme. The container forces a white background + dark text so dark-mode
 * users get a clean print preview.
 */
export function InvoicePrintLayout({ invoice, business, party, lastPayment, payToAccount }: Props) {
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const currency = business?.currency ?? "INR";

  return (
    <div
      className="invoice-print relative mx-auto bg-white text-slate-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm",
        boxSizing: "border-box",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Watermark / Stamp (print-safe, no image asset required) */}
      <div className="pointer-events-none absolute right-[16mm] top-[250mm] hidden print:block">
        <SnickrStamp />
      </div>

      {/* ---------- Letterhead ---------- */}
      <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-4">
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
            <h1 className="text-xl font-bold leading-tight">{business?.name ?? "Your Business"}</h1>
            <div className="mt-1 text-xs leading-relaxed text-slate-700">
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
              <div className="mt-1 space-y-0.5">
                {business?.mobile && <div>Phone no.: {business.mobile}</div>}
                {business?.email && <div>Email: {business.email}</div>}
              </div>
              {business?.gstNumber && (
                <div className="mt-1 font-mono">GSTIN: {business.gstNumber}</div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex flex-col items-end gap-1">
            <SnickrLogo />
            <p className="text-sm font-bold">Tax Invoice</p>
          </div>
        </div>
      </header>

      {/* ---------- Bill To / Invoice Details ---------- */}
      <section className="mt-5 grid grid-cols-2 gap-10 text-xs">
        <div>
          <p className="text-sm font-bold">Bill To</p>
          <p className="mt-1 text-sm font-semibold">{invoice.partyName}</p>
          {party?.mobile && <p className="mt-0.5">Contact No.: {party.mobile}</p>}
        </div>
        <div>
          <p className="text-sm font-bold">Invoice Details</p>
          <div className="mt-1 space-y-0.5">
            <p>
              Invoice No.: <span className="font-semibold">{invoice.number}</span>
            </p>
            <p>
              Date: <span className="font-semibold">{format(new Date(invoice.date), "dd-MM-yyyy")}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Items ---------- */}
      <section className="mt-5">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="w-10 px-2 py-2 text-left font-semibold">#</th>
              <th className="px-2 py-2 text-left font-semibold">Item name</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">Price/ Unit</th>
              <th className="w-28 px-2 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, idx) => {
              const m = lineMath(line);
              const displayName = `${line.qty} ${line.name}`.trim();
              return (
                <tr key={line.id} className="border-b border-slate-200 align-top">
                  <td className="px-2 py-2">{idx + 1}</td>
                  <td className="px-2 py-2">{displayName}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(line.rate, currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(m.total, currency)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-2 py-2 text-right font-semibold">
                Total
              </td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums">
                {formatCurrency(invoice.total, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* ---------- Amount in words ---------- */}
      <section className="mt-4 text-xs">
        <p className="font-semibold">Invoice Amount In Words</p>
        <p className="mt-1">{sentenceCase(amountInWords(invoice.total, currency))}</p>
      </section>

      {/* ---------- Terms / Totals / Pay To ---------- */}
      <section className="mt-5 grid grid-cols-2 gap-10 text-xs">
        <div className="space-y-3">
          <div>
            <p className="font-semibold">Terms And Conditions</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4 leading-relaxed">
              {termsList(invoice.terms).map((t, i) => (
                <li key={`${i}-${t}`}>{t}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="space-y-1">
          <KV label="Sub Total" value={formatCurrency(invoice.total, currency)} />
          <KV label="Total" value={formatCurrency(invoice.total, currency)} />
          <KV label="Received" value={formatCurrency(invoice.paidAmount, currency)} />
          <KV label="Balance" value={formatCurrency(balance, currency)} />
          <KV
            label="Payment Mode"
            value={
              lastPayment
                ? `${PAYMENT_MODE_LABEL[lastPayment.mode]}${lastPayment.account ? ` (${lastPayment.account})` : ""}`
                : "—"
            }
          />
          <KV label="Previous Balance" value={formatCurrency(0, currency)} />
          <KV label="Current Balance" value={formatCurrency(0, currency)} />
          <div className="pt-2" />
          <p className="font-semibold">Pay To:</p>
          {payToAccount ? (
            <div className="space-y-0.5 leading-relaxed">
              <div>Bank Name: {payToAccount.name}</div>
              {payToAccount.accountNumber && <div>Bank Account No.: {payToAccount.accountNumber}</div>}
              {payToAccount.ifsc && <div>Bank IFSC code: {payToAccount.ifsc}</div>}
              <div>Account Holder&apos;s Name: {business?.name ?? "—"}</div>
            </div>
          ) : (
            <div className="text-slate-600">—</div>
          )}
        </div>
      </section>

      {/* ---------- Signature ---------- */}
      <section className="mt-6 text-xs">
        <p>For: {business?.name ?? "Your Business"}</p>
        <div className="relative mt-10 w-56 border-t border-slate-400 pt-1 text-[10px] uppercase tracking-wider text-slate-600">
          Authorized Signatory
          <div className="pointer-events-none absolute -right-24 -top-20 opacity-60 print:opacity-80">
            <SnickrStamp />
          </div>
        </div>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">
        This is a system-generated invoice.
      </footer>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-slate-700">{label}</span>
      <span className="tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

function sentenceCase(s: string) {
  const t = (s ?? "").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function termsList(raw?: string) {
  const cleaned = (raw ?? "").trim();
  if (cleaned) {
    const lines = cleaned
      .split(/\r?\n+/)
      .map((l) => l.trim().replace(/^\d+[\).\s]+/, ""))
      .filter(Boolean);
    if (lines.length) return lines;
  }
  return [
    "Payment is due immediately unless otherwise agreed.",
    "Any dispute regarding service quality must be reported within 24 hours of service completion.",
    "This invoice is generated for completed services/products.",
  ];
}

function SnickrLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2.5c-4.97 0-9 4.03-9 9 0 4.47 3.27 8.18 7.55 8.87.42.07.57-.18.57-.4v-1.4c-3.07.67-3.72-1.32-3.72-1.32-.5-1.28-1.22-1.62-1.22-1.62-.99-.68.08-.66.08-.66 1.1.08 1.68 1.12 1.68 1.12.98 1.68 2.57 1.19 3.2.91.1-.71.38-1.19.7-1.47-2.45-.28-5.03-1.22-5.03-5.43 0-1.2.43-2.18 1.12-2.95-.11-.28-.49-1.41.11-2.94 0 0 .92-.29 3.01 1.13.87-.24 1.8-.36 2.73-.36.93 0 1.86.12 2.73.36 2.09-1.42 3.01-1.13 3.01-1.13.6 1.53.22 2.66.11 2.94.69.77 1.12 1.75 1.12 2.95 0 4.22-2.58 5.15-5.04 5.42.39.34.74 1.02.74 2.06v3.05c0 .22.15.48.58.4A9 9 0 0 0 21 11.5c0-4.97-4.03-9-9-9Z"
          fill="#111827"
        />
      </svg>
      <span className="text-xs font-semibold tracking-wide text-slate-800">snickr</span>
    </div>
  );
}

function SnickrStamp() {
  return (
    <div
      style={{
        width: "70mm",
        height: "70mm",
        borderRadius: "9999px",
        border: "2px solid rgba(15, 23, 42, 0.35)",
        position: "relative",
        transform: "rotate(-12deg)",
        background: "rgba(148, 163, 184, 0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "10mm",
          borderRadius: "9999px",
          border: "1px dashed rgba(15, 23, 42, 0.28)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "2mm",
          color: "rgba(15, 23, 42, 0.7)",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: 700 }}>Snickr</div>
        <div style={{ fontSize: "18px", fontWeight: 800 }}>AUTHORIZED</div>
        <div style={{ fontSize: "10px", fontWeight: 700 }}>Signatory</div>
      </div>
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
