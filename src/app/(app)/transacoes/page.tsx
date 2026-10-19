import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { TransactionRow } from "@/components/TransactionList";
import { inScope } from "@/lib/finance";
import { formatBRL, todayISO } from "@/lib/format";
import { requireRepo } from "@/lib/repo";
import { SCOPE_LABEL, parseScope } from "@/lib/scope";
import { CATEGORIES } from "@/lib/types";
import { addTransaction, removeTransaction } from "../actions";

const PAGE_SIZE = 50;

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const scope = parseScope(params.v);
  const q = (params.q ?? "").trim().toLowerCase();
  const limit = Math.max(PAGE_SIZE, Number(params.n) || PAGE_SIZE);

  const repo = await requireRepo();
  const [accounts, allTxs] = await Promise.all([repo.listAccounts(), repo.listTransactions()]);
  const txs = inScope(allTxs, scope).filter(
    (t) => !q || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
  );
  const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);

  const moreParams = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1] && e[0] !== "ok" && e[0] !== "erro"));
  moreParams.set("n", String(limit + PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PageHeader title="Transações" subtitle={`${SCOPE_LABEL[scope]}${q ? ` · busca: “${params.q}”` : ""}`}>
        <div className="flex gap-6 text-sm">
          <span className="text-muted">
            Entradas <strong className="ml-1 text-up">{formatBRL(income)}</strong>
          </span>
          <span className="text-muted">
            Saídas <strong className="ml-1 text-down">{formatBRL(expenses)}</strong>
          </span>
        </div>
      </PageHeader>
      <Flash error={params.erro} ok={params.ok} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <section id="nova" className="panel h-fit scroll-mt-4">
          <h2 className="mb-4 text-lg">Nova transação</h2>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted">
              Crie uma conta primeiro em <Link className="text-accent hover:underline" href="/contas">Contas e cartões</Link>.
            </p>
          ) : (
            <form action={addTransaction} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-1">
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="saida" defaultChecked className="peer sr-only" />
                  <span className="block rounded-xl py-2 text-center text-sm text-muted peer-checked:bg-down/15 peer-checked:text-down">Saída</span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="type" value="entrada" className="peer sr-only" />
                  <span className="block rounded-xl py-2 text-center text-sm text-muted peer-checked:bg-up/15 peer-checked:text-up">Entrada</span>
                </label>
              </div>
              <div>
                <label className="label" htmlFor="description">Descrição</label>
                <input className="input" id="description" name="description" required placeholder="Ex.: Mercado do mês" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="amount">Valor (R$)</label>
                  <input className="input" id="amount" name="amount" required inputMode="decimal" placeholder="0,00" />
                </div>
                <div>
                  <label className="label" htmlFor="date">Data</label>
                  <input className="input" id="date" name="date" type="date" required defaultValue={todayISO()} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="accountId">Conta</label>
                <select className="input" id="accountId" name="accountId" required>
                  {(["pessoal", "casal"] as const).map((s) => {
                    const list = accounts.filter((a) => a.scope === s);
                    return list.length ? (
                      <optgroup key={s} label={s === "casal" ? "Do casal" : "Minhas"}>
                        {list.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                            {a.last4 ? ` •••• ${a.last4}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="category">Categoria</label>
                <select className="input" id="category" name="category" defaultValue="outros">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary w-full">Salvar</button>
            </form>
          )}
        </section>

        <section className="panel">
          <h2 className="mb-4 text-lg">Histórico</h2>
          {txs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nenhuma transação encontrada.</p>
          ) : (
            <ul className="space-y-2">
              {txs.slice(0, limit).map((t) => (
                <TransactionRow key={t.id} t={t}>
                  <form action={removeTransaction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-down" title="Excluir" aria-label={`Excluir ${t.description}`}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </TransactionRow>
              ))}
            </ul>
          )}
          {txs.length > limit && (
            <Link href={`/transacoes?${moreParams}`} scroll={false} className="btn-ghost mt-4 w-full">
              Carregar mais
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
