/**
 * Builds compact JSON snapshots of the current business's data for AI calls.
 * Pure functions — accept already-fetched arrays from hooks.
 */
import { differenceInDays, format, startOfMonth, subMonths } from "date-fns";
import type { Invoice } from "@/types/invoice";
import type { Purchase } from "@/types/purchase";
import type { Payment } from "@/types/payment";
import type { Expense } from "@/types/expense";
import type { Party } from "@/types/party";

export interface DashboardSnapshot {
  currency: string;
  asOf: string;
  totals: {
    sales: number;
    received: number;
    receivable: number;
    purchases: number;
    payable: number;
    expenses: number;
    netProfit: number;
  };
  topCustomers: Array<{ name: string; outstanding: number }>;
  topSuppliers: Array<{ name: string; outstanding: number }>;
  overdueInvoices: Array<{ number: string; party: string; daysOverdue: number; balance: number }>;
  expenseByCategory: Array<{ category: string; amount: number }>;
  monthlyTrend: Array<{ month: string; sales: number; expense: number; net: number }>;
}

export function buildDashboardSnapshot(args: {
  currency: string;
  invoices: Invoice[];
  purchases: Purchase[];
  payments: Payment[];
  expenses: Expense[];
  parties: Party[];
}): DashboardSnapshot {
  const { currency, invoices, purchases, expenses, parties } = args;
  const live = invoices.filter((i) => i.status !== "cancelled");
  const livePur = purchases.filter((p) => p.status !== "cancelled");

  const totals = {
    sales: round(live.reduce((s, i) => s + i.total, 0)),
    received: round(live.reduce((s, i) => s + i.paidAmount, 0)),
    receivable: round(live.reduce((s, i) => s + (i.total - i.paidAmount), 0)),
    purchases: round(livePur.reduce((s, p) => s + p.total, 0)),
    payable: round(livePur.reduce((s, p) => s + (p.total - p.paidAmount), 0)),
    expenses: round(expenses.reduce((s, e) => s + e.amount, 0)),
    netProfit: 0,
  };
  totals.netProfit = round(totals.sales - totals.purchases - totals.expenses);

  // Top customers by outstanding
  const custMap = new Map<string, number>();
  for (const i of live) {
    const bal = i.total - i.paidAmount;
    if (bal <= 0) continue;
    custMap.set(i.partyName, (custMap.get(i.partyName) ?? 0) + bal);
  }
  const topCustomers = [...custMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, outstanding]) => ({ name, outstanding: round(outstanding) }));

  // Top suppliers by payable
  const supMap = new Map<string, number>();
  for (const p of livePur) {
    const bal = p.total - p.paidAmount;
    if (bal <= 0) continue;
    const partyName = parties.find((pa) => pa.id === p.partyId)?.name ?? "Unknown";
    supMap.set(partyName, (supMap.get(partyName) ?? 0) + bal);
  }
  const topSuppliers = [...supMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, outstanding]) => ({ name, outstanding: round(outstanding) }));

  // Overdue (past due date or >30d if no due date)
  const today = new Date();
  const overdueInvoices = live
    .filter((i) => i.total - i.paidAmount > 0)
    .map((i) => {
      const due = i.dueDate ? new Date(i.dueDate) : new Date(i.date);
      const days = differenceInDays(today, due);
      return {
        number: i.number,
        party: i.partyName,
        daysOverdue: days,
        balance: round(i.total - i.paidAmount),
      };
    })
    .filter((x) => x.daysOverdue > 0)
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 8);

  // Expense by category
  const catMap = new Map<string, number>();
  for (const e of expenses) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
  }
  const expenseByCategory = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount: round(amount) }));

  // Monthly trend last 6 months
  const monthlyTrend: DashboardSnapshot["monthlyTrend"] = [];
  for (let i = 5; i >= 0; i--) {
    const m = startOfMonth(subMonths(today, i));
    const monthKey = format(m, "yyyy-MM");
    const sales = live
      .filter((inv) => inv.date.startsWith(monthKey))
      .reduce((s, inv) => s + inv.total, 0);
    const expense = expenses
      .filter((e) => e.date.startsWith(monthKey))
      .reduce((s, e) => s + e.amount, 0);
    monthlyTrend.push({
      month: format(m, "MMM yyyy"),
      sales: round(sales),
      expense: round(expense),
      net: round(sales - expense),
    });
  }

  return {
    currency,
    asOf: format(today, "yyyy-MM-dd"),
    totals,
    topCustomers,
    topSuppliers,
    overdueInvoices,
    expenseByCategory,
    monthlyTrend,
  };
}

export interface PartyHistorySnapshot {
  partyName: string;
  type: string;
  invoices: Array<{
    number: string;
    date: string;
    total: number;
    paidAmount: number;
    daysToPay: number | null;
  }>;
  averageDaysToPay: number | null;
  totalBilled: number;
  totalReceived: number;
  outstanding: number;
}

export function buildPartyHistorySnapshot(args: {
  party: Party;
  invoices: Invoice[];
  payments: Payment[];
}): PartyHistorySnapshot {
  const { party, invoices, payments } = args;
  const partyInvoices = invoices.filter((i) => i.partyId === party.id && i.status !== "cancelled");

  const invoiceData = partyInvoices.map((inv) => {
    // Find latest payment fully covering this invoice
    let lastPayDate: Date | null = null;
    let cumPaid = 0;
    const sortedPays = payments
      .filter((p) => p.allocations.some((a) => a.docId === inv.id))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const p of sortedPays) {
      const alloc = p.allocations.find((a) => a.docId === inv.id);
      if (!alloc) continue;
      cumPaid += alloc.amount;
      if (cumPaid >= inv.total) {
        lastPayDate = new Date(p.date);
        break;
      }
    }
    const daysToPay = lastPayDate ? differenceInDays(lastPayDate, new Date(inv.date)) : null;
    return {
      number: inv.number,
      date: inv.date,
      total: round(inv.total),
      paidAmount: round(inv.paidAmount),
      daysToPay,
    };
  });

  const paidWithDays = invoiceData.filter((d) => d.daysToPay !== null) as Array<
    (typeof invoiceData)[number] & { daysToPay: number }
  >;
  const averageDaysToPay = paidWithDays.length
    ? Math.round(paidWithDays.reduce((s, d) => s + d.daysToPay, 0) / paidWithDays.length)
    : null;

  const totalBilled = round(partyInvoices.reduce((s, i) => s + i.total, 0));
  const totalReceived = round(partyInvoices.reduce((s, i) => s + i.paidAmount, 0));

  return {
    partyName: party.name,
    type: party.type,
    invoices: invoiceData.slice(-15),
    averageDaysToPay,
    totalBilled,
    totalReceived,
    outstanding: round(totalBilled - totalReceived),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
