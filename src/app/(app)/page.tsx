import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AccountCards } from "@/components/AccountCards";
import { Avatar } from "@/components/Avatar";
import { BalanceChart } from "@/components/charts/BalanceChart";
import { MonthlyBars } from "@/components/charts/MonthlyBars";
import { Delta } from "@/components/Delta";
import { RatingBadge } from "@/components/RatingBadge";
import { TransactionList } from "@/components/TransactionList";
import {
  PERIODS,
  accountBalances,
  balanceSeries,
  inScope,
  monthlyFlow,
  monthlyInvestments,
  percentChange,
  type Period,
} from "@/lib/finance";
import { formatBRL } from "@/lib/format";
import { getMarketSnapshot } from "@/lib/market/data";
import { requireRepo } from "@/lib/repo";
import { SCOPE_LABEL, parseScope } from "@/lib/scope";
import type { Profile } from "@/lib/types";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const scope = parseScope(params.v);
  const period = PERIODS.find((p) => p.id === params.p) ?? PERIODS[1]!;

  const repo = await requireRepo();
  const [allAccounts, allTxs, allInvestments, couple] = await Promise.all([
    repo.listAccounts(),
    repo.listTransactions(),
    repo.listInvestments(),
    repo.getCouple(),
  ]);
  const accounts = inScope(allAccounts, scope);
  const txs = inScope(allTxs, scope);
  const investments = inScope(allInvestments, scope);

  const today = new Date();
  const balances = accountBalances(accounts, txs);
  const series = balanceSeries(accounts, txs, period.months, today);
  const current = series[series.length - 1]?.balance ?? 0;
  const change = percentChange(series[0]?.balance ?? 0, current);
  const flows = monthlyFlow(txs, today, 6).slice(0, -1);
  const avgExpenses = flows.length ? flows.reduce((s, f) => s + f.expenses, 0) / flows.length : 0;
  const avgIncome = flows.length ? flows.reduce((s, f) => s + f.income, 0) / flows.length : 0;

  const invMonths = monthlyInvestments(investments, today, 6);
  const invTotal = investments.reduce((s, i) => s + i.amount, 0);
  const lastTwo = invMonths.slice(-2);
  const invChange = percentChange(lastTwo[0]?.value ?? 0, lastTwo[1]?.value ?? 0);

  const qs = (p: Period) => {
    const next = new URLSearchParams();
    if (scope !== "tudo") next.set("v", scope);
    next.set("p", p);
    return `/?${next}`;
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_minmax(320px,0.9fr)]">
      <section className="panel xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg text-ink/90">
              Saldo total <span className="text-sm text-muted">· {SCOPE_LABEL[scope]}</span>
            </h2>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
              <span className="text-3xl sm:text-4xl font-light tracking-tight">{formatBRL(current)}</span>
              <Delta value={change} />
            </p>
          </div>
          <nav className="flex max-w-full overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1" aria-label="Período">
            {PERIODS.map((p) => (
              <Link key={p.id} href={qs(p.id)} className={`chip ${p.id === period.id ? "chip-active" : ""}`} scroll={false}>
                {p.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-4">
          <BalanceChart data={series} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <span>
            Entradas médias/mês <strong className="ml-1 font-medium text-up">{formatBRL(avgIncome)}</strong>
          </span>
          <span>
            Gastos médios/mês <strong className="ml-1 font-medium text-ink">{formatBRL(avgExpenses)}</strong>
          </span>
        </div>
      </section>

      <aside className="panel space-y-5 xl:row-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Minhas contas</h2>
          <Link href="/contas" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted hover:text-ink">
            + Adicionar
          </Link>
        </div>
        <AccountCards accounts={accounts} balances={balances} />
        <div className="grid grid-cols-2 gap-3">
          <Link href="/transacoes#nova" className="btn-ghost">
            <ArrowDownLeft size={16} /> Lançar
          </Link>
          <Link href="/investimentos#novo" className="btn-primary">
            <ArrowUpRight size={16} /> Investir
          </Link>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">Transações recentes</h2>
            <Link href={scope === "tudo" ? "/transacoes" : `/transacoes?v=${scope}`} className="text-sm text-muted hover:text-ink">
              Ver todas
            </Link>
          </div>
          <TransactionList items={txs.slice(0, 5)} />
        </div>
      </aside>

      <Suspense fallback={<section className="panel-accent min-h-64 animate-pulse" />}>
        <InvestMomentCard members={couple?.members ?? [repo.me]} />
      </Suspense>

      <section className="panel">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg">Investimentos</h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-light">{formatBRL(invTotal)}</span>
              <Delta value={invChange} />
            </p>
          </div>
          <Link href="/investimentos" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted hover:text-ink">
            Últimos 6 meses
          </Link>
        </div>
        <MonthlyBars data={invMonths} />
      </section>
    </div>
  );
}

async function InvestMomentCard({ members }: { members: Profile[] }) {
  const market = await getMarketSnapshot();
  const highlights = [market.equity, ...market.fixedIncome].filter((s) => s !== null);
  const best = highlights.find((s) => s.rating === "favoravel") ?? highlights[0];

  return (
    <section className="panel-accent relative flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-black/40 blur-2xl" aria-hidden />
      <h2 className="text-2xl font-semibold leading-tight">
        Quando investir?
        <span className="block text-white/60">Termômetro do mercado</span>
      </h2>
      {best ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <RatingBadge rating={best.rating} />
            <span className="text-sm font-medium">{best.title}</span>
          </div>
          <p className="text-sm text-white/80">{best.summary}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/80">Os dados de mercado estão indisponíveis agora. Veja o guia de quando investir.</p>
      )}
      <div className="mt-4 flex -space-x-2">
        {members.map((m, i) => (
          <Avatar key={m.id} name={m.name} size={36} index={i} />
        ))}
      </div>
      <div className="relative mt-auto pt-6">
        <Link href="/mercado" className="btn-light w-full">
          Ver análise completa
        </Link>
      </div>
    </section>
  );
}
