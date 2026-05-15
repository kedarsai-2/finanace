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

/** Base body size — slightly larger than legacy 11px for print readability. */
const BODY = "12px";
const BODY_SM = "11.5px";
const LABEL = "14px";
const TITLE = "40px";
const COMPANY = "20px";

/**
 * Print-friendly tax invoice layout (A4).
 * Text-only letterhead matching reference PDF spacing; no platform logos.
 */
export function InvoicePrintLayout({ invoice, business, party }: Props) {
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const currency = business?.currency ?? "INR";
  const businessName = business?.name ?? "Your Business";
  const addressLines = [
    [business?.billingAddress?.line1, business?.billingAddress?.line2].filter(Boolean).join(", "),
    [business?.city, business?.state, business?.billingAddress?.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);
  const terms = termsList(invoice.terms);

  return (
    <div
      className="invoice-print relative mx-auto bg-white text-slate-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm 14mm 12mm 14mm",
        boxSizing: "border-box",
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        fontSize: BODY,
        lineHeight: 1.45,
        letterSpacing: "0.01em",
      }}
    >
      <header className="grid grid-cols-2 gap-8 border-b border-slate-300 pb-4">
        <div>
          <h1 className="font-bold leading-snug text-slate-900" style={{ fontSize: COMPANY }}>
            {businessName}
          </h1>
          <div className="mt-2 space-y-1 text-slate-800" style={{ fontSize: BODY, lineHeight: 1.5 }}>
            {addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {business?.mobile && <div>Phone no. : {business.mobile}</div>}
            {business?.email && <div>Email : {business.email}</div>}
            {business?.gstNumber && (
              <div className="font-mono" style={{ fontSize: BODY_SM }}>
                GSTIN: {business.gstNumber}
              </div>
            )}
          </div>
        </div>
        <div className="text-right" style={{ fontSize: BODY }}>
          <p className="leading-snug">
            For : <span className="font-semibold">{businessName}</span>
          </p>
          <p className="mt-14 font-semibold tracking-wide">Authorized Signatory</p>
        </div>
      </header>

      <div className="py-3 text-center">
        <p
          className="font-bold leading-none tracking-[0.3px] text-[#8a86cf]"
          style={{ fontSize: TITLE }}
        >
          Tax Invoice
        </p>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-12" style={{ fontSize: BODY }}>
        <div>
          <p className="font-bold" style={{ fontSize: LABEL }}>
            Bill To
          </p>
          <p className="mt-1.5 font-semibold" style={{ fontSize: LABEL }}>
            {invoice.partyName}
          </p>
          {party?.mobile && (
            <p className="mt-1" style={{ lineHeight: 1.5 }}>
              Contact No. : {party.mobile}
            </p>
          )}
        </div>
        <div>
          <p className="font-bold" style={{ fontSize: LABEL }}>
            Invoice Details
          </p>
          <div className="mt-1.5 space-y-1" style={{ lineHeight: 1.5 }}>
            <p>
              Invoice No. : <span className="font-semibold">{invoice.number}</span>
            </p>
            <p>
              Date :{" "}
              <span className="font-semibold">{format(new Date(invoice.date), "dd-MM-yyyy")}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <table className="w-full border-collapse" style={{ fontSize: BODY }}>
          <thead>
            <tr className="border-b border-slate-300 bg-[#8a86cf] text-white">
              <th className="w-9 px-2 py-2 text-left font-semibold">#</th>
              <th className="px-2 py-2 text-left font-semibold">Item name</th>
              <th className="w-[30mm] px-2 py-2 text-right font-semibold">Price/ Unit</th>
              <th className="w-[30mm] px-2 py-2 text-right font-semibold">Amount</th>
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
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatCurrency(line.rate, currency)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatCurrency(m.total, currency)}
                  </td>
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

      <section className="mt-4" style={{ fontSize: BODY, lineHeight: 1.5 }}>
        <p className="font-semibold">Description</p>
        <p className="mt-1.5 whitespace-pre-wrap">{(invoice.notes ?? "").trim() || "—"}</p>
      </section>

      <section className="mt-4" style={{ fontSize: BODY, lineHeight: 1.5 }}>
        <p className="font-semibold">Invoice Amount In Words</p>
        <p className="mt-1.5">{sentenceCase(amountInWords(invoice.total, currency))}</p>
      </section>

      <section className="mt-6 grid grid-cols-[1.55fr_1fr] gap-10" style={{ fontSize: BODY }}>
        {terms.length > 0 ? (
          <div>
            <p className="font-semibold">Terms and Conditions</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5" style={{ lineHeight: 1.55 }}>
              {terms.map((t, i) => (
                <li key={`${i}-${t}`}>{t}</li>
              ))}
            </ol>
          </div>
        ) : (
          <div />
        )}
        <div className="space-y-1.5" style={{ lineHeight: 1.45 }}>
          <KV label="Sub Total" value={formatCurrency(invoice.total, currency)} />
          <KV label="Total" value={formatCurrency(invoice.total, currency)} highlight />
          <KV label="Received" value={formatCurrency(invoice.paidAmount, currency)} />
          <KV label="Balance" value={formatCurrency(balance, currency)} />
          <KV label="Previous Balance" value={formatCurrency(0, currency)} />
          <KV label="Current Balance" value={formatCurrency(0, currency)} />
        </div>
      </section>

      <footer
        className="absolute bottom-[12mm] left-0 right-0 text-center text-slate-500"
        style={{ fontSize: BODY_SM }}
      >
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
          ? "flex items-baseline justify-between gap-4 bg-[#8a86cf] px-2 py-1 text-white"
          : "flex items-baseline justify-between gap-4"
      }
    >
      <span className={highlight ? "text-white" : "text-slate-700"}>{label}</span>
      <span
        className={
          highlight
            ? "min-w-[96px] text-right tabular-nums text-white"
            : "min-w-[96px] text-right tabular-nums text-slate-900"
        }
      >
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

function termsList(raw?: string): string[] {
  const cleaned = (raw ?? "").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\r?\n+/)
    .map((l) => l.trim().replace(/^\d+[).\s]+/, ""))
    .filter(Boolean);
}

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
