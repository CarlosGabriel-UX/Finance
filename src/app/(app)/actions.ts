"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseAmount } from "@/lib/parse";
import { requireRepo, type Repo } from "@/lib/repo";
import type { InvestmentKind, Scope } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function scopeOf(form: FormData): Scope {
  return str(form, "scope") === "casal" ? "casal" : "pessoal";
}

function dateOf(form: FormData) {
  const d = str(form, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error("Data inválida.");
  return d;
}

async function run(path: string, ok: string, fn: (repo: Repo) => Promise<void>): Promise<never> {
  const repo = await requireRepo();
  let error: string | null = null;
  try {
    await fn(repo);
  } catch (e) {
    error = e instanceof Error ? e.message : "Algo deu errado.";
  }
  revalidatePath("/", "layout");
  redirect(`${path}?${new URLSearchParams(error ? { erro: error } : { ok })}`);
}

export async function addTransaction(form: FormData) {
  await run("/transacoes", "Transação registrada.", async (repo) => {
    const description = str(form, "description");
    if (!description) throw new Error("Informe uma descrição.");
    const amount = parseAmount(str(form, "amount"));
    await repo.createTransaction({
      accountId: str(form, "accountId"),
      description,
      category: str(form, "category") || "outros",
      amount: str(form, "type") === "entrada" ? amount : -amount,
      occurredAt: dateOf(form),
    });
  });
}

export async function removeTransaction(form: FormData) {
  await run("/transacoes", "Transação excluída.", async (repo) => {
    await repo.deleteTransaction(str(form, "id"));
  });
}

export async function addAccount(form: FormData) {
  await run("/contas", "Conta criada.", async (repo) => {
    const name = str(form, "name");
    if (!name) throw new Error("Informe o nome da conta.");
    const last4 = str(form, "last4").replace(/\D/g, "").slice(-4) || null;
    const initial = str(form, "initialBalance");
    await repo.createAccount({
      name,
      brand: str(form, "brand") || "outro",
      last4,
      scope: scopeOf(form),
      initialBalance: initial ? (str(form, "negative") ? -1 : 1) * (parseAmount(initial)) : 0,
    });
  });
}

export async function addInvestment(form: FormData) {
  await run("/investimentos", "Investimento registrado.", async (repo) => {
    const name = str(form, "name");
    if (!name) throw new Error("Informe o nome do investimento.");
    const kind: InvestmentKind = str(form, "kind") === "renda_variavel" ? "renda_variavel" : "renda_fixa";
    await repo.createInvestment({ name, kind, amount: parseAmount(str(form, "amount")), investedAt: dateOf(form), scope: scopeOf(form) });
  });
}

export async function removeInvestment(form: FormData) {
  await run("/investimentos", "Investimento excluído.", async (repo) => {
    await repo.deleteInvestment(str(form, "id"));
  });
}

export async function createCouple(form: FormData) {
  await run("/casal", "Casal criado! Envie o código de convite para seu par.", async (repo) => {
    await repo.createCouple(str(form, "name"));
  });
}

export async function joinCouple(form: FormData) {
  await run("/casal", "Pronto, vocês estão conectados!", async (repo) => {
    const code = str(form, "code");
    if (!code) throw new Error("Informe o código de convite.");
    await repo.joinCouple(code);
  });
}
