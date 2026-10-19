import { describe, expect, it } from "vitest";
import { accountBalances, balanceSeries, inScope, monthlyInvestments, percentChange, totalBalance } from "./finance";
import type { Account, Investment, Transaction } from "./types";

const accounts: Account[] = [
  { id: "a", name: "Pessoal", brand: "visa", last4: null, scope: "pessoal", initialBalance: 1000 },
  { id: "b", name: "Casal", brand: "visa", last4: null, scope: "casal", initialBalance: 500 },
];
const tx = (accountId: string, occurredAt: string, amount: number, scope: Transaction["scope"]): Transaction => ({
  id: `${accountId}-${occurredAt}-${amount}`,
  accountId,
  occurredAt,
  amount,
  scope,
  description: "x",
  category: "outros",
  createdByName: null,
});
const txs = [tx("a", "2026-01-10", -200, "pessoal"), tx("b", "2026-02-05", 300, "casal"), tx("a", "2026-03-01", 50, "pessoal")];

describe("finance", () => {
  it("computes balances per account and total", () => {
    const b = accountBalances(accounts, txs);
    expect(b.get("a")).toBe(850);
    expect(b.get("b")).toBe(800);
    expect(totalBalance(accounts, txs)).toBe(1650);
  });

  it("filters by scope", () => {
    expect(inScope(txs, "casal")).toHaveLength(1);
    expect(inScope(txs, "tudo")).toHaveLength(3);
  });

  it("builds a daily series ending at the current balance", () => {
    const series = balanceSeries(accounts, txs, 1, new Date(2026, 2, 15));
    expect(series[0]!.date).toBe("2026-02-15");
    // Transações anteriores ao início entram no saldo inicial.
    expect(series[0]!.balance).toBe(1600);
    expect(series.at(-1)).toEqual({ date: "2026-03-15", balance: 1650 });
  });

  it("only counts transactions of the given accounts", () => {
    const series = balanceSeries([accounts[1]!], txs, 3, new Date(2026, 2, 15));
    expect(series.at(-1)!.balance).toBe(800);
  });

  it("groups investments by month", () => {
    const inv: Investment[] = [
      { id: "1", kind: "renda_fixa", name: "CDB", amount: 100, investedAt: "2026-03-02", scope: "pessoal" },
      { id: "2", kind: "renda_variavel", name: "BOVA11", amount: 50, investedAt: "2026-03-20", scope: "casal" },
      { id: "3", kind: "renda_fixa", name: "LCI", amount: 70, investedAt: "2025-01-01", scope: "pessoal" },
    ];
    const months = monthlyInvestments(inv, new Date(2026, 2, 25), 3);
    expect(months).toEqual([
      { month: "2026-01", value: 0 },
      { month: "2026-02", value: 0 },
      { month: "2026-03", value: 150 },
    ]);
  });

  it("computes percent change", () => {
    expect(percentChange(100, 110)).toBe(10);
    expect(percentChange(0, 50)).toBe(0);
    expect(percentChange(-100, -50)).toBe(50);
  });
});
