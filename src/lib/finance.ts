import { toISODate } from "./format";
import type { Account, Investment, ScopeFilter, Transaction } from "./types";

export type Period = "1m" | "3m" | "6m" | "1a";

export const PERIODS: { id: Period; label: string; months: number }[] = [
  { id: "1a", label: "1 ano", months: 12 },
  { id: "6m", label: "6 meses", months: 6 },
  { id: "3m", label: "3 meses", months: 3 },
  { id: "1m", label: "1 mês", months: 1 },
];

export function inScope<T extends { scope: string }>(items: T[], filter: ScopeFilter): T[] {
  return filter === "tudo" ? items : items.filter((i) => i.scope === filter);
}

export function accountBalances(accounts: Account[], txs: Transaction[]): Map<string, number> {
  const balances = new Map(accounts.map((a) => [a.id, a.initialBalance]));
  for (const t of txs) {
    if (balances.has(t.accountId)) balances.set(t.accountId, balances.get(t.accountId)! + t.amount);
  }
  return balances;
}

export function totalBalance(accounts: Account[], txs: Transaction[]): number {
  let total = 0;
  for (const v of accountBalances(accounts, txs).values()) total += v;
  return round2(total);
}

export interface BalancePoint {
  date: string;
  balance: number;
}

/** Saldo diário acumulado das contas nos últimos `months` meses até `today`. */
export function balanceSeries(accounts: Account[], txs: Transaction[], months: number, today: Date): BalancePoint[] {
  const accountIds = new Set(accounts.map((a) => a.id));
  const start = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
  const startISO = toISODate(start);

  let running = accounts.reduce((s, a) => s + a.initialBalance, 0);
  const daily = new Map<string, number>();
  for (const t of txs) {
    if (!accountIds.has(t.accountId)) continue;
    if (t.occurredAt < startISO) running += t.amount;
    else daily.set(t.occurredAt, (daily.get(t.occurredAt) ?? 0) + t.amount);
  }

  const points: BalancePoint[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    running += daily.get(iso) ?? 0;
    points.push({ date: iso, balance: round2(running) });
  }
  return points;
}

export function percentChange(from: number, to: number): number {
  if (from === 0) return 0;
  return round2(((to - from) / Math.abs(from)) * 100);
}

export interface MonthValue {
  month: string; // YYYY-MM
  value: number;
}

function lastMonths(today: Date, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push(toISODate(d).slice(0, 7));
  }
  return out;
}

export function monthlyInvestments(investments: Investment[], today: Date, count = 6): MonthValue[] {
  const months = lastMonths(today, count);
  const totals = new Map(months.map((m) => [m, 0]));
  for (const inv of investments) {
    const m = inv.investedAt.slice(0, 7);
    if (totals.has(m)) totals.set(m, totals.get(m)! + inv.amount);
  }
  return months.map((m) => ({ month: m, value: round2(totals.get(m)!) }));
}

export interface MonthlyFlow {
  month: string;
  income: number;
  expenses: number;
}

export function monthlyFlow(txs: Transaction[], today: Date, count = 6): MonthlyFlow[] {
  const months = lastMonths(today, count);
  const flows = new Map(months.map((m) => [m, { month: m, income: 0, expenses: 0 }]));
  for (const t of txs) {
    const f = flows.get(t.occurredAt.slice(0, 7));
    if (!f) continue;
    if (t.amount >= 0) f.income += t.amount;
    else f.expenses += -t.amount;
  }
  return months.map((m) => {
    const f = flows.get(m)!;
    return { month: m, income: round2(f.income), expenses: round2(f.expenses) };
  });
}

export function expensesByCategory(txs: Transaction[], sinceISO: string): { category: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const t of txs) {
    if (t.amount >= 0 || t.occurredAt < sinceISO) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) - t.amount);
  }
  return [...totals.entries()]
    .map(([category, value]) => ({ category, value: round2(value) }))
    .sort((a, b) => b.value - a.value);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
