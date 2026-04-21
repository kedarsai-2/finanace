import { toast } from "sonner";

export interface ShareInvoiceArgs {
  partyName: string;
  invoiceNumber: string;
  /** Absolute URL to the printable invoice. */
  pdfUrl: string;
  /** Optional pre-formatted total / balance line. */
  summaryLine?: string;
  /** Mobile number (any format). When missing, opens WhatsApp without a recipient. */
  phone?: string;
}

/** Build the canonical message body used in WhatsApp + clipboard fallback. */
export function buildShareMessage(args: ShareInvoiceArgs): string {
  const lines = [
    `Hi ${args.partyName || "there"}, here is your invoice ${args.invoiceNumber}.`,
  ];
  if (args.summaryLine) lines.push("", args.summaryLine);
  lines.push("", `View / download: ${args.pdfUrl}`);
  return lines.join("\n");
}

/** Strip non-digits and drop a leading 0; WhatsApp expects E.164 without "+". */
function normalisePhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D+/g, "");
  return digits.replace(/^0+/, "");
}

export function buildWhatsAppUrl(args: ShareInvoiceArgs): string {
  const message = buildShareMessage(args);
  const phone = normalisePhone(args.phone);
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Open WhatsApp share. Falls back to clipboard copy on popup-blockers. */
export function shareInvoiceOnWhatsApp(args: ShareInvoiceArgs) {
  const url = buildWhatsAppUrl(args);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    void copyShareText(args).then(() => {
      toast.error("Couldn't open WhatsApp", {
        description: "We copied the message + link to your clipboard instead.",
      });
    });
  }
}

/** Copy the full prepared message (incl. PDF link) to the clipboard. */
export async function copyShareText(args: ShareInvoiceArgs): Promise<boolean> {
  const text = buildShareMessage(args);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success("Message copied", {
        description: "Paste it into WhatsApp or any chat.",
      });
      return true;
    }
  } catch {
    /* fall through */
  }
  // Last-ditch fallback for older browsers.
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast.success("Message copied to clipboard");
    return true;
  } catch {
    toast.error("Couldn't copy automatically", {
      description: "Long-press to copy: " + text,
    });
    return false;
  }
}

/** Public URL to the printable invoice (used as the "PDF link" in shares). */
export function invoicePrintUrl(invoiceId: string): string {
  if (typeof window === "undefined") return `/invoices/${invoiceId}/print`;
  return `${window.location.origin}/invoices/${invoiceId}/print`;
}

/** Open mailto: with the invoice link prefilled. */
export function shareInvoiceByEmail(args: ShareInvoiceArgs & { email?: string }) {
  const subject = `Invoice ${args.invoiceNumber}`;
  const body = buildShareMessage(args);
  const to = args.email ?? "";
  const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}
