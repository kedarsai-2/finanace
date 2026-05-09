import type { Expense } from "@/types/expense";
import type { Invoice, InvoiceLine } from "@/types/invoice";
import type { Purchase, PurchaseLine } from "@/types/purchase";

type Row = Record<string, unknown>;

export const EXPENSE_REPORT_HEADERS = [
  "Date",
  "Invoice No",
  "Party Name",
  "GSTIN",
  "Category Name",
  "Payment Type",
  "Total Amount",
  "Received/Paid Amount",
  "Balance Due",
  "Description",
] as const;

export const EXPENSE_ITEM_HEADERS = [
  "Date",
  "Order No.",
  "Party Name",
  "Category Name",
  "Item Name",
  "Description",
  "HSN/SAC",
  "Quantity",
  "UnitPrice",
  "Discount Percent",
  "Discount",
  "Tax Percent",
  "Tax",
  "Amount",
] as const;

export const PURCHASE_REPORT_HEADERS = [
  "Date",
  "Order No",
  "Invoice No",
  "Party Name",
  "GSTIN",
  "Party Phone No.",
  "Total Amount",
  "Payment Type",
  "Received/Paid Amount",
  "Balance Due",
  "Description",
] as const;

export const PURCHASE_ITEM_HEADERS = [
  "Date",
  "Invoice No./Txn No.",
  "Party Name",
  "Item Name",
  "Item Code",
  "HSN/SAC",
  "Category",
  "Challan/Order No.",
  "Quantity",
  "Unit",
  "UnitPrice",
  "Discount Percent",
  "Discount",
  "Tax Percent",
  "Tax",
  "Transaction Type",
  "Amount",
] as const;

export const SALES_REPORT_HEADERS = [
  "Date",
  "Order No",
  "Invoice No",
  "Party Name",
  "GSTIN",
  "Party Phone No.",
  "Transaction Type",
  "Total Amount",
  "Payment Type",
  "Received/Paid Amount",
  "Balance Due",
  "Description",
] as const;

export const SALES_ITEM_HEADERS = [
  "Date",
  "Invoice No./Txn No.",
  "Party Name",
  "Item Name",
  "Item Code",
  "HSN/SAC",
  "Category",
  "Challan/Order No.",
  "Quantity",
  "Unit",
  "UnitPrice",
  "Discount Percent",
  "Discount",
  "Tax Percent",
  "Tax",
  "Transaction Type",
  "Amount",
] as const;

function asText(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s ? s : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function pick(row: Row, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in row) return row[key];
  }
  return undefined;
}

/**
 * Maps one "Expense Report" sheet row into expense import metadata fields.
 * Does not mutate core behavior fields outside explicit mapping.
 */
export function mapExpenseReportRowToExpenseFields(row: Row): Partial<Expense> {
  return {
    reference: asText(pick(row, "Invoice No", "Invoice No.", "InvoiceNo")),
    category: asText(pick(row, "Category Name")) ?? "",
    amount: asNumber(pick(row, "Total Amount")) ?? 0,
    receivedPaidAmount: asNumber(pick(row, "Received/Paid Amount")),
    balanceDue: asNumber(pick(row, "Balance Due")),
    notes: asText(pick(row, "Description")),
  };
}

/**
 * Maps one "Expense Item Details" sheet row into optional item-level fields
 * captured on `Expense`.
 */
export function mapExpenseItemRowToExpenseFields(row: Row): Partial<Expense> {
  return {
    orderNo: asText(pick(row, "Order No.", "Order No")),
    category: asText(pick(row, "Category Name")) ?? "",
    itemName: asText(pick(row, "Item Name")),
    itemDescription: asText(pick(row, "Description")),
    hsnSac: asText(pick(row, "HSN/SAC", "HSN", "SAC")),
    quantity: asNumber(pick(row, "Quantity")),
    unitPrice: asNumber(pick(row, "UnitPrice", "Unit Price")),
    discountPercent: asNumber(pick(row, "Discount Percent")),
    discountAmount: asNumber(pick(row, "Discount")),
    taxPercent: asNumber(pick(row, "Tax Percent")),
    taxAmount: asNumber(pick(row, "Tax")),
    lineAmount: asNumber(pick(row, "Amount")),
  };
}

/**
 * Maps one "Purchase Report" row into purchase header fields.
 */
export function mapPurchaseReportRowToPurchaseFields(row: Row): Partial<Purchase> {
  return {
    orderNo: asText(pick(row, "Order No", "Order No.")),
    invoiceNo: asText(pick(row, "Invoice No", "Invoice No.")),
    total: asNumber(pick(row, "Total Amount")) ?? 0,
    paidAmount: asNumber(pick(row, "Received/Paid Amount")) ?? 0,
    notes: asText(pick(row, "Description")),
  };
}

/**
 * Maps one "Purchase Item Details" row into optional purchase line fields.
 */
export function mapPurchaseItemRowToPurchaseLineFields(row: Row): Partial<PurchaseLine> {
  return {
    name: asText(pick(row, "Item Name")) ?? "",
    hsnSac: asText(pick(row, "HSN/SAC", "HSN", "SAC")),
    category: asText(pick(row, "Category")),
    challanOrderNo: asText(pick(row, "Challan/Order No.", "Challan/Order No")),
    qty: asNumber(pick(row, "Quantity")) ?? 0,
    unit: asText(pick(row, "Unit")) ?? "pcs",
    rate: asNumber(pick(row, "UnitPrice", "Unit Price")) ?? 0,
    discountKind: "percent",
    discountValue: asNumber(pick(row, "Discount Percent", "Discount")) ?? 0,
    taxPercent: asNumber(pick(row, "Tax Percent")) ?? 0,
    taxAmount: asNumber(pick(row, "Tax")),
    transactionType: asText(pick(row, "Transaction Type")),
    lineAmount: asNumber(pick(row, "Amount")),
  };
}

export function mapSalesReportRowToInvoiceFields(row: Row): Partial<Invoice> {
  const paymentBreakup = Object.fromEntries(
    Object.entries(row)
      .filter(([k, v]) => !SALES_REPORT_HEADERS.includes(k as (typeof SALES_REPORT_HEADERS)[number]))
      .map(([k, v]) => [k, asNumber(v) ?? 0])
      .filter(([, v]) => v > 0),
  );
  return {
    orderNo: asText(pick(row, "Order No", "Order No.")),
    invoiceNo: asText(pick(row, "Invoice No", "Invoice No.")),
    gstin: asText(pick(row, "GSTIN", "GST No", "GST Number")),
    partyPhoneNo: asText(pick(row, "Party Phone No.", "Party Phone No", "Phone")),
    transactionType: asText(pick(row, "Transaction Type")),
    total: asNumber(pick(row, "Total Amount")) ?? 0,
    paymentType: asText(pick(row, "Payment Type")),
    receivedPaidAmount: asNumber(pick(row, "Received/Paid Amount")),
    balanceDue: asNumber(pick(row, "Balance Due")),
    notes: asText(pick(row, "Description")),
    paymentBreakupJson: Object.keys(paymentBreakup).length ? JSON.stringify(paymentBreakup) : undefined,
  };
}

export function mapSalesItemRowToInvoiceLineFields(row: Row): Partial<InvoiceLine> {
  return {
    name: asText(pick(row, "Item Name")) ?? "",
    itemCode: asText(pick(row, "Item Code")),
    hsnSac: asText(pick(row, "HSN/SAC", "HSN", "SAC")),
    category: asText(pick(row, "Category")),
    challanOrderNo: asText(pick(row, "Challan/Order No.", "Challan/Order No")),
    qty: asNumber(pick(row, "Quantity")) ?? 0,
    unit: asText(pick(row, "Unit")) ?? "pcs",
    rate: asNumber(pick(row, "UnitPrice", "Unit Price")) ?? 0,
    discountKind: "percent",
    discountValue: asNumber(pick(row, "Discount Percent", "Discount")) ?? 0,
    taxPercent: asNumber(pick(row, "Tax Percent")) ?? 0,
    taxAmount: asNumber(pick(row, "Tax")),
    transactionType: asText(pick(row, "Transaction Type")),
    lineAmount: asNumber(pick(row, "Amount")),
  };
}
