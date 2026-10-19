import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { ScopeSelect } from "@/components/ScopeSelect";
import { accountBalances, inScope } from "@/lib/finance";
import { formatBRL } from "@/lib/format";
import { requireRepo } from "@/lib/repo";
import { parseScope } from "@/lib/scope";
import { addAccount } from "../actions";

export default async function AccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const scope = parseScope(params.v);
  const repo = await requireRepo();
  const [allAccounts, txs, couple] = await Promise.all([repo.listAccounts(), repo.listTransactions(), repo.getCouple()]);
  const accounts = inScope(allAccounts, scope);
  const balances = accountBalances(accounts, txs);

  return (
    <div className="space-y-4">
      <PageHeader title="Contas e cartões" subtitle="Contas pessoais só você vê. Contas do casal vocês dois veem e movimentam." />
      <Flash error={params.erro} ok={params.ok} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_minmax(300px,380px)]">
        <section className="grid content-start gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <article key={a.id} className={a.scope === "casal" ? "panel-accent" : "panel"}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold uppercase italic">{a.brand}</span>
                <span className="rounded-full bg-black/30 px-2.5 py-1 text-xs">{a.scope === "casal" ? "Casal" : "Pessoal"}</span>
              </div>
              <p className="mt-6 text-sm text-white/70">
                {a.name}
                {a.last4 ? ` •••• ${a.last4}` : ""}
              </p>
              <p className="text-2xl font-light">{formatBRL(balances.get(a.id) ?? 0)}</p>
            </article>
          ))}
          {accounts.length === 0 && <p className="panel text-sm text-muted">Nenhuma conta ainda. Crie a primeira ao lado.</p>}
        </section>

        <section className="panel h-fit">
          <h2 className="mb-4 text-lg">Nova conta ou cartão</h2>
          <form action={addAccount} className="space-y-3">
            <div>
              <label className="label" htmlFor="name">Nome</label>
              <input className="input" id="name" name="name" required placeholder="Ex.: Nubank, Conta conjunta" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="brand">Bandeira</label>
                <select className="input" id="brand" name="brand" defaultValue="visa">
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="elo">Elo</option>
                  <option value="conta">Conta corrente</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="last4">Final</label>
                <input className="input" id="last4" name="last4" inputMode="numeric" maxLength={4} placeholder="1234" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="initialBalance">Saldo atual (R$)</label>
              <input className="input" id="initialBalance" name="initialBalance" inputMode="decimal" placeholder="0,00" />
              <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" name="negative" value="1" /> Saldo negativo
              </label>
            </div>
            <ScopeSelect hasCouple={Boolean(couple)} />
            <button className="btn-primary w-full">Criar conta</button>
          </form>
        </section>
      </div>
    </div>
  );
}
