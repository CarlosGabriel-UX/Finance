import { Trash2 } from "lucide-react";
import Link from "next/link";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { Flash } from "@/components/Flash";
import { PageHeader } from "@/components/PageHeader";
import { ScopeSelect } from "@/components/ScopeSelect";
import { inScope, monthlyInvestments } from "@/lib/finance";
import { formatBRL, formatDate, todayISO } from "@/lib/format";
import { requireRepo } from "@/lib/repo";
import { SCOPE_LABEL, parseScope } from "@/lib/scope";
import type { InvestmentKind } from "@/lib/types";
import { addInvestment, removeInvestment } from "../actions";

const KIND_LABEL: Record<InvestmentKind, string> = { renda_fixa: "Renda fixa", renda_variavel: "Renda variável" };

export default async function InvestmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const scope = parseScope(params.v);
  const repo = await requireRepo();
  const [all, couple] = await Promise.all([repo.listInvestments(), repo.getCouple()]);
  const investments = inScope(all, scope);
  const total = investments.reduce((s, i) => s + i.amount, 0);
  const byKind = (k: InvestmentKind) => investments.filter((i) => i.kind === k).reduce((s, i) => s + i.amount, 0);
  const fixed = byKind("renda_fixa");
  const variable = byKind("renda_variavel");
  const fixedPct = total ? (fixed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Investimentos" subtitle={`Aportes registrados · ${SCOPE_LABEL[scope]}`}>
        <Link href="/mercado" className="btn-ghost">Quando investir?</Link>
      </PageHeader>
      <Flash error={params.erro} ok={params.ok} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="panel">
          <p className="text-sm text-muted">Total aportado</p>
          <p className="text-3xl font-light">{formatBRL(total)}</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-accent" style={{ width: `${fixedPct}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-accent" />
              Renda fixa {formatBRL(fixed)}
            </span>
            <span>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-white/30" />
              Variável {formatBRL(variable)}
            </span>
          </div>
        </section>
        <section className="panel lg:col-span-2">
          <h2 className="text-lg">Aportes por mês</h2>
          <MonthlyBars data={monthlyInvestments(investments, new Date(), 12)} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <section id="novo" className="panel h-fit scroll-mt-4">
          <h2 className="mb-4 text-lg">Novo aporte</h2>
          <form action={addInvestment} className="space-y-3">
            <div>
              <label className="label" htmlFor="name">Ativo</label>
              <input className="input" id="name" name="name" required placeholder="Ex.: Tesouro Selic, BOVA11" />
            </div>
            <div>
              <label className="label" htmlFor="kind">Tipo</label>
              <select className="input" id="kind" name="kind">
                <option value="renda_fixa">Renda fixa</option>
                <option value="renda_variavel">Renda variável (ações, ETFs, FIIs)</option>
              </select>
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
            <ScopeSelect hasCouple={Boolean(couple)} />
            <button className="btn-primary w-full">Registrar aporte</button>
          </form>
        </section>

        <section className="panel">
          <h2 className="mb-4 text-lg">Histórico de aportes</h2>
          {investments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nenhum aporte registrado.</p>
          ) : (
            <ul className="space-y-2">
              {investments.slice(0, 60).map((i) => (
                <li key={i.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${i.kind === "renda_fixa" ? "bg-accent" : "bg-white/40"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(i.investedAt)} · {KIND_LABEL[i.kind]} · {i.scope === "casal" ? "Casal" : "Pessoal"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatBRL(i.amount)}</p>
                  <form action={removeInvestment}>
                    <input type="hidden" name="id" value={i.id} />
                    <button className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-down" title="Excluir" aria-label={`Excluir ${i.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
