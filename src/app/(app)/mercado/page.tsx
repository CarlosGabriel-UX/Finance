import { AlertTriangle, Info } from "lucide-react";
import { PriceLine } from "@/components/charts/PriceLine";
import { RatingBadge } from "@/components/RatingBadge";
import { PageHeader } from "@/components/PageHeader";
import { formatPercent } from "@/lib/format";
import { getMarketSnapshot } from "@/lib/market/data";
import type { Signal } from "@/lib/market/signals";

export const revalidate = 3600;

function SignalCard({ signal, accent = false }: { signal: Signal; accent?: boolean }) {
  return (
    <article className={accent ? "panel-accent" : "panel"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{signal.title}</h3>
        <RatingBadge rating={signal.rating} />
      </div>
      <p className={`mt-3 text-sm ${accent ? "text-white/85" : "text-ink/85"}`}>{signal.summary}</p>
      <ul className={`mt-3 space-y-1 text-xs ${accent ? "text-white/70" : "text-muted"}`}>
        {signal.reasons.map((r) => (
          <li key={r}>• {r}</li>
        ))}
      </ul>
    </article>
  );
}

const num = (n: number | null, digits = 2) => (n === null ? "–" : n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }));

export default async function MarketPage() {
  const market = await getMarketSnapshot();
  const updated = new Date(market.updatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  return (
    <div className="space-y-4">
      <PageHeader title="Quando investir" subtitle={`Termômetro de renda fixa e renda variável · atualizado em ${updated}`} />

      <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
        <Info size={18} className="mt-0.5 shrink-0 text-accent" />
        <p>
          Indicadores automáticos e educativos, calculados com dados públicos (Banco Central e cotações da B3). Não são recomendação de
          investimento. Para o longo prazo, aportes regulares e diversificados costumam vencer tentativas de acertar o momento exato.
        </p>
      </div>

      {market.errors.length > 0 && (
        <div className="flex gap-3 rounded-2xl border border-down/30 bg-down/10 p-4 text-sm text-down">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <ul>
            {market.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {market.rates && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Meta Selic", `${num(market.rates.selic)}% a.a.`],
            ["IPCA 12 meses", `${num(market.rates.ipca12m)}%`],
            ["Juro real", `${num(market.rates.realRate)}% a.a.`],
            ["Selic esperada (Focus)", market.rates.selicExpected === null ? "–" : `${num(market.rates.selicExpected)}% a.a.`],
          ].map(([label, value]) => (
            <div key={label} className="panel">
              <p className="text-sm text-muted">{label}</p>
              <p className="text-2xl font-light">{value}</p>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg">Renda fixa</h2>
          {market.fixedIncome.length ? (
            market.fixedIncome.map((s) => <SignalCard key={s.title} signal={s} />)
          ) : (
            <p className="panel text-sm text-muted">Sem dados de juros no momento.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg">Renda variável</h2>
          {market.equity ? <SignalCard signal={market.equity} accent /> : <p className="panel text-sm text-muted">Sem dados do Ibovespa no momento.</p>}
          {market.ibovHistory.length > 0 && (
            <div className="panel">
              <p className="mb-2 text-sm text-muted">Ibovespa · últimos 12 meses</p>
              <PriceLine data={market.ibovHistory} />
            </div>
          )}
        </section>
      </div>

      {market.stocks.length > 0 && (
        <section className="panel overflow-x-auto">
          <h2 className="mb-1 text-lg">Ações e ETFs em observação</h2>
          <p className="mb-4 text-sm text-muted">Ordenadas da mais favorável para a menos favorável pelos sinais técnicos.</p>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 font-medium">Ativo</th>
                <th className="pb-2 text-right font-medium">Preço</th>
                <th className="pb-2 text-right font-medium">1 mês</th>
                <th className="pb-2 text-right font-medium">IFR 14</th>
                <th className="pb-2 text-right font-medium">Da máxima</th>
                <th className="pb-2 text-right font-medium">Sinal</th>
              </tr>
            </thead>
            <tbody>
              {market.stocks.map(({ ticker, name, analysis: a }) => (
                <tr key={ticker} className="border-t border-white/5" title={a.reasons.join("\n")}>
                  <td className="py-3">
                    <p className="font-medium">{ticker}</p>
                    <p className="text-xs text-muted">{name}</p>
                  </td>
                  <td className="text-right">R$ {num(a.price)}</td>
                  <td className={`text-right ${a.change1mPct !== null && a.change1mPct < 0 ? "text-down" : "text-up"}`}>
                    {a.change1mPct === null ? "–" : `${a.change1mPct >= 0 ? "+" : ""}${formatPercent(a.change1mPct)}`}
                  </td>
                  <td className="text-right">{num(a.rsi14, 0)}</td>
                  <td className="text-right">−{formatPercent(a.drawdownPct)}</td>
                  <td className="text-right">
                    <RatingBadge rating={a.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="panel">
        <h2 className="mb-3 text-lg">Guia rápido</h2>
        <div className="grid grid-cols-1 gap-4 text-sm text-muted md:grid-cols-3">
          <div>
            <p className="mb-1 font-medium text-ink">Reserva primeiro</p>
            <p>Antes de ações, montem uma reserva de 6 meses de gastos em pós-fixados com liquidez diária (Tesouro Selic, CDB 100% CDI).</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-ink">Juros altos e no pico</p>
            <p>Quando a Selic está alta e o mercado espera cortes, prefixados e IPCA+ costumam ser bons momentos para travar taxa.</p>
          </div>
          <div>
            <p className="mb-1 font-medium text-ink">Bolsa com desconto</p>
            <p>Quedas fortes (IFR baixo, longe da máxima) tendem a ser boas janelas para aportes graduais em ETFs e boas empresas.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
