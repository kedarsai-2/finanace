import { format } from "date-fns";
import type { Account } from "@/types/account";
import type { Business } from "@/types/business";
import type { Party } from "@/types/party";
import type { Invoice } from "@/types/invoice";
import { lineMath } from "@/types/invoice";
import { formatCurrency } from "@/hooks/useParties";

interface Props {
  invoice: Invoice;
  business?: Business;
  party?: Party;
  /** Primary bank account shown in the Pay To block. */
  payToAccount?: Account;
}

/** Typography tuned to match reference Tax Invoice PDF (11pt body, compact spacing). */
const BODY = "11px";
const BODY_SM = "10.5px";
const SECTION_LABEL = "12px";
const TITLE = "26px";
const COMPANY = "18px";
const SIGNATURE_STAMP_SRC = "/invoice-signature-stamp.png";

const DEFAULT_TERMS = [
  "This invoice is generated for services completed through the Snickr platform.",
  "Snickr acts as a service facilitation platform connecting customers with independent service providers.",
  "Charges include service fees, convenience/platform fees.",
  "Payment is due immediately unless otherwise agreed.",
  "Refunds and cancellations are governed by SnickR's refund policy.",
  "Any dispute regarding service quality must be reported within 24 hours of service completion.",
  "Snickr's liability is limited to the platform/service facilitation charges collected.",
];

/**
 * Print-friendly tax invoice layout (A4) — matches reference PDF spacing and type scale.
 */
export function InvoicePrintLayout({ invoice, business, party, payToAccount }: Props) {
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const currency = business?.currency ?? "INR";
  const businessName = business?.name ?? "Your Business";
  const [businessNameLine1, businessNameLine2] = splitBusinessNameTwoLines(businessName);
  const addressLines = [
    [business?.billingAddress?.line1, business?.billingAddress?.line2].filter(Boolean).join(", "),
    [business?.city, business?.state, business?.billingAddress?.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);
  const terms = termsList(invoice.terms);

  return (
    <div
      className="invoice-print relative mx-auto min-h-[297mm] bg-white text-slate-900 print:min-h-0"
      style={{
        width: "210mm",
        padding: "12mm 12mm 10mm 12mm",
        boxSizing: "border-box",
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        fontSize: BODY,
        lineHeight: 1.4,
        letterSpacing: "0",
      }}
    >
      <header className="grid grid-cols-[1fr_auto] items-start gap-6 border-b border-slate-300 pb-3">
        <div className="min-w-0">
          <h1
            className="font-bold uppercase leading-[1.12] tracking-[0.01em] text-slate-900"
            style={{ fontSize: COMPANY }}
          >
            <span className="block">{businessNameLine1}</span>
            {businessNameLine2 ? <span className="block">{businessNameLine2}</span> : null}
          </h1>
          <div className="mt-1 text-slate-800" style={{ fontSize: BODY, lineHeight: 1.45 }}>
            {addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {business?.mobile && <div>Phone no. : {business.mobile}</div>}
            {business?.email && <div>Email : {business.email}</div>}
            {business?.gstNumber && (
              <div className="mt-0.5 font-mono" style={{ fontSize: BODY_SM }}>
                GSTIN: {business.gstNumber}
              </div>
            )}
          </div>
        </div>
        <BrandLogo logoUrl={business?.logoUrl} businessName={businessName} />
      </header>

      <div className="py-1 text-center">
        <p
          className="font-bold leading-tight tracking-[0.15px] text-[#8a86cf]"
          style={{ fontSize: TITLE }}
        >
          Tax Invoice
        </p>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-10" style={{ fontSize: BODY }}>
        <div>
          <p className="font-bold" style={{ fontSize: SECTION_LABEL }}>
            Bill To
          </p>
          <p className="mt-1 font-semibold" style={{ fontSize: SECTION_LABEL }}>
            {invoice.partyName}
          </p>
          {party?.mobile && <p className="mt-0.5">Contact No. : {party.mobile}</p>}
        </div>
        <div className="text-right">
          <p className="font-bold" style={{ fontSize: SECTION_LABEL }}>
            Invoice Details
          </p>
          <div className="mt-1 space-y-0.5">
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

      <section className="mt-4">
        <table className="w-full border-collapse" style={{ fontSize: BODY }}>
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

      <section className="mt-3" style={{ fontSize: BODY, lineHeight: 1.4 }}>
        <p className="font-semibold">Description</p>
        <p className="mt-1 whitespace-pre-wrap">{(invoice.notes ?? "").trim() || "—"}</p>
      </section>

      <section className="mt-3" style={{ fontSize: BODY, lineHeight: 1.4 }}>
        <p className="font-semibold">Invoice Amount In Words</p>
        <p className="mt-1">{amountInWordsDisplay(invoice.total, currency)}</p>
      </section>

      <section className="mt-4 grid grid-cols-[1.6fr_1fr] gap-8" style={{ fontSize: BODY }}>
        <div>
          <p className="font-semibold">Terms and Conditions</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4" style={{ lineHeight: 1.45 }}>
            {terms.map((t, i) => (
              <li key={`${i}-${t}`}>{t}</li>
            ))}
          </ol>
        </div>
        <div className="space-y-0.5" style={{ lineHeight: 1.35 }}>
          <KV label="Sub Total" value={formatCurrency(invoice.total, currency)} />
          <KV label="Total" value={formatCurrency(invoice.total, currency)} highlight />
          <KV label="Received" value={formatCurrency(invoice.paidAmount, currency)} />
          <KV label="Balance" value={formatCurrency(balance, currency)} />
          <KV label="Previous Balance" value={formatCurrency(0, currency)} />
          <KV label="Current Balance" value={formatCurrency(0, currency)} />
        </div>
      </section>

      <section
        className="mt-6 grid grid-cols-2 items-start gap-10"
        style={{ fontSize: BODY, lineHeight: 1.45 }}
      >
        <PayToBlock
          line1={businessNameLine1}
          line2={businessNameLine2}
          fullName={businessName}
          account={payToAccount}
        />
        <AuthorizedSignatory
          line1={businessNameLine1}
          line2={businessNameLine2}
          fullName={businessName}
        />
      </section>

      <footer className="mt-6 text-center text-slate-500" style={{ fontSize: BODY_SM }}>
        -- 1 of 1 --
      </footer>
    </div>
  );
}

function PayToBlock({
  line1,
  line2,
  fullName,
  account,
}: {
  line1: string;
  line2: string;
  fullName: string;
  account?: Account;
}) {
  const bankName = account?.name?.trim();
  const accountNo = account?.accountNumber?.trim();
  const ifsc = account?.ifsc?.trim();

  if (!bankName && !accountNo && !ifsc) {
    return (
      <div>
        <p className="font-semibold">Pay To:</p>
        <p className="mt-1 text-slate-600">Bank details not configured.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-semibold">Pay To:</p>
      <div className="mt-1 space-y-0.5">
        {bankName ? (
          <p>
            Bank Name : <span className="font-semibold">{bankName}</span>
          </p>
        ) : null}
        {accountNo ? (
          <p>
            Bank Account No. : <span className="font-semibold">{accountNo}</span>
          </p>
        ) : null}
        {ifsc ? (
          <p>
            Bank IFSC code : <span className="font-semibold">{ifsc}</span>
          </p>
        ) : null}
        {fullName ? (
          <p>
            Account holder&apos;s name :{" "}
            <span className="font-semibold">
              {line2 ? (
                <>
                  {line1}
                  <br />
                  {line2}
                </>
              ) : (
                fullName
              )}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function AuthorizedSignatory({
  line1,
  line2,
  fullName,
}: {
  line1: string;
  line2: string;
  fullName: string;
}) {
  return (
    <div className="text-right" style={{ lineHeight: 1.4 }}>
      <p className="font-semibold">
        For :
        {line2 ? (
          <>
            <span className="block">{line1}</span>
            <span className="block">{line2}</span>
          </>
        ) : (
          <span>{fullName}</span>
        )}
      </p>
      <div className="ml-auto mt-2 inline-flex w-[48mm] flex-col items-center">
        <img
          src={SIGNATURE_STAMP_SRC}
          alt="Authorized signatory stamp"
          className="h-[20mm] w-full object-contain"
        />
        <p className="mt-1 w-full text-center font-semibold">Authorized Signatory</p>
      </div>
    </div>
  );
}

/** Split long company names onto two lines like the reference invoice header. */
function splitBusinessNameTwoLines(name: string): [string, string] {
  const n = name.trim();
  if (!n) return ["Your Business", ""];

  const madnessSuffix = n.match(
    /^(.+?)\s+(MADNESS(?:\s+PRIVATE\s+LIMITED|\s+PVT\.?\s+LTD\.?)?)$/i,
  );
  if (madnessSuffix) {
    return [madnessSuffix[1].trim(), madnessSuffix[2].trim()];
  }

  const pvtSuffix = n.match(/^(.+?)\s+(PRIVATE\s+LIMITED|PVT\.?\s+LTD\.?|LIMITED)$/i);
  if (pvtSuffix) {
    const leftWords = pvtSuffix[1].trim().split(/\s+/);
    if (leftWords.length > 2) {
      const mid = Math.ceil(leftWords.length / 2);
      return [
        leftWords.slice(0, mid).join(" "),
        `${leftWords.slice(mid).join(" ")} ${pvtSuffix[2]}`.trim(),
      ];
    }
    return [pvtSuffix[1].trim(), pvtSuffix[2].trim()];
  }

  const words = n.split(/\s+/);
  if (words.length <= 3) return [n, ""];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

function BrandLogo({ logoUrl, businessName }: { logoUrl?: string; businessName: string }) {
  const src = logoUrl?.trim() || "/snickr-logo.png";
  return (
    <img
      src={src}
      alt={`${businessName} logo`}
      className="h-[18mm] w-[18mm] shrink-0 object-contain object-right"
    />
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        highlight
          ? "flex items-baseline justify-between gap-3 bg-[#8a86cf] px-1.5 py-0.5 text-white"
          : "flex items-baseline justify-between gap-3"
      }
    >
      <span className={highlight ? "text-white" : "text-slate-700"}>{label}</span>
      <span
        className={
          highlight
            ? "min-w-[88px] text-right tabular-nums text-white"
            : "min-w-[88px] text-right tabular-nums text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}

function termsList(raw?: string): string[] {
  const cleaned = (raw ?? "").trim();
  if (!cleaned) return DEFAULT_TERMS;
  const lines = cleaned
    .split(/\r?\n+/)
    .map((l) => l.trim().replace(/^\d+[).\s]+/, ""))
    .filter(Boolean);
  return lines.length ? lines : DEFAULT_TERMS;
}

function amountInWordsDisplay(amount: number, currency: string): string {
  if (Math.abs(amount) < 0.005) return "Zero";
  const words = amountInWords(amount, currency);
  const t = words.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
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
