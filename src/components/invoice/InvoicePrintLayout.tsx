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
  const paymentModeText = lastPayment
    ? (lastPayment.account ?? payToAccount?.name ?? PAYMENT_MODE_LABEL[lastPayment.mode])
    : "—";

  return (
    <div
      className="invoice-print relative mx-auto bg-white text-slate-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "12mm 12mm 10mm 12mm",
        boxSizing: "border-box",
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ---------- Letterhead ---------- */}
      <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-3">
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
            <h1 className="text-[18px] font-bold leading-tight">
              {business?.name ?? "Your Business"}
            </h1>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-700">
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
          </div>
        </div>
      </header>

      <div className="py-1.5 text-center">
        <p className="text-[38px] font-bold leading-none tracking-[0.2px] text-[#8a86cf]">
          Tax Invoice
        </p>
      </div>

      {/* ---------- Bill To / Invoice Details ---------- */}
      <section className="mt-4 grid grid-cols-2 gap-10 text-[11px]">
        <div>
          <p className="text-[13px] font-bold">Bill To</p>
          <p className="mt-1 text-[13px] font-semibold">{invoice.partyName}</p>
          {party?.mobile && <p className="mt-0.5">Contact No.: {party.mobile}</p>}
        </div>
        <div>
          <p className="text-[13px] font-bold">Invoice Details</p>
          <div className="mt-1 space-y-0.5">
            <p>
              Invoice No.: <span className="font-semibold">{invoice.number}</span>
            </p>
            <p>
              Date:{" "}
              <span className="font-semibold">{format(new Date(invoice.date), "dd-MM-yyyy")}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Items ---------- */}
      <section className="mt-4">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-300 bg-[#8a86cf] text-white">
              <th className="w-8 px-1.5 py-1.5 text-left font-semibold">#</th>
              <th className="px-1.5 py-1.5 text-left font-semibold">Item name</th>
              <th className="w-28 px-1.5 py-1.5 text-right font-semibold">Price/ Unit</th>
              <th className="w-28 px-1.5 py-1.5 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, idx) => {
              const m = lineMath(line);
              const displayName = `${line.qty} ${line.name}`.trim();
              return (
                <tr key={line.id} className="border-b border-slate-200 align-top">
                  <td className="px-1.5 py-1.5">{idx + 1}</td>
                  <td className="px-1.5 py-1.5">{displayName}</td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums">
                    {formatCurrency(line.rate, currency)}
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums">
                    {formatCurrency(m.total, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-1.5 py-1.5 text-right font-semibold">
                Total
              </td>
              <td className="px-1.5 py-1.5 text-right font-semibold tabular-nums">
                {formatCurrency(invoice.total, currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* ---------- Amount in words ---------- */}
      <section className="mt-3 text-[11px]">
        <p className="font-semibold">Invoice Amount In Words</p>
        <p className="mt-1">{sentenceCase(amountInWords(invoice.total, currency))}</p>
      </section>

      {/* ---------- Terms / Totals / Pay To ---------- */}
      <section className="mt-4 grid grid-cols-[1.6fr_1fr] gap-8 text-[11px]">
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
          <KV label="Total" value={formatCurrency(invoice.total, currency)} highlight />
          <KV label="Received" value={formatCurrency(invoice.paidAmount, currency)} />
          <KV label="Balance" value={formatCurrency(balance, currency)} />
          <KV label="Payment Mode" value={paymentModeText} />
          <KV label="Previous Balance" value={formatCurrency(0, currency)} />
          <KV label="Current Balance" value={formatCurrency(0, currency)} />
          <div className="pt-2" />
          <p className="font-semibold">Pay To:</p>
          {payToAccount ? (
            <div className="space-y-0.5 leading-relaxed">
              <div>Bank Name: {payToAccount.name}</div>
              {payToAccount.accountNumber && (
                <div>Bank Account No.: {payToAccount.accountNumber}</div>
              )}
              {payToAccount.ifsc && <div>Bank IFSC code: {payToAccount.ifsc}</div>}
              <div>Account Holder&apos;s Name: {business?.name ?? "—"}</div>
            </div>
          ) : (
            <div className="text-slate-600">—</div>
          )}
        </div>
      </section>

      {/* ---------- Signature ---------- */}
      <section className="mt-10 text-[11px]">
        <div className="ml-auto w-[72mm] text-left">
          <p className="font-medium">For: {business?.name ?? "Your Business"}</p>
          <div className="flex h-[22mm] items-center justify-center">
            <SmallStamp />
          </div>
          <p className="font-semibold">Authorized Signatory</p>
        </div>
      </section>

      <footer className="absolute bottom-[10mm] left-0 right-0 text-center text-[10px] text-slate-500">
        -- 1 of 1 --
      </footer>
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "flex items-baseline justify-between gap-6 bg-[#8a86cf] px-1.5 py-0.5 text-white"
          : "flex items-baseline justify-between gap-6"
      }
    >
      <span className={highlight ? "text-white" : "text-slate-700"}>{label}</span>
      <span className={highlight ? "tabular-nums text-white" : "tabular-nums text-slate-900"}>
        {value}
      </span>
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
      .map((l) => l.trim().replace(/^\d+[).\s]+/, ""))
      .filter(Boolean);
    if (lines.length) return lines;
  }
  return [
    "This invoice is generated for services completed through the Snickr platform.",
    "Snickr acts as a service facilitation platform connecting customers with independent service providers.",
    "Charges include service fees, convenience/platform fees.",
    "Payment is due immediately unless otherwise agreed.",
    "Refunds and cancellations are governed by SnickR’s refund policy.",
    "Any dispute regarding service quality must be reported within 24 hours of service completion.",
    "Snickr’s liability is limited to the platform/service facilitation charges collected.",
  ];
}

function SnickrLogo() {
  return (
    <img
      src="/snickr-logo.png"
      alt="SnickR"
      style={{ height: "40px", width: "96px", objectFit: "contain" }}
    />
  );
}

function SmallStamp() {
  return (
    <img
      src="/snickr-stamp.png"
      alt="Authorized stamp"
      style={{ height: "24mm", width: "auto", objectFit: "contain" }}
    />
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
