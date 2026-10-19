import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function TransactionRow({ t, children }: { t: Transaction; children?: React.ReactNode }) {
  const income = t.amount >= 0;
  const Icon = income ? ArrowDownLeft : ArrowUpRight;
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${income ? "bg-up/10 text-up" : "bg-white/5 text-ink"}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t.description}</p>
        <p className="truncate text-xs text-muted">
          {formatDate(t.occurredAt)} · {t.category}
          {t.scope === "casal" && t.createdByName ? ` · por ${t.createdByName}` : ""}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${income ? "text-up" : "text-down"}`}>
          {income ? "+" : "−"}
          {formatBRL(Math.abs(t.amount))}
        </p>
        <p className="text-[11px] text-muted">{t.scope === "casal" ? "Casal" : "Pessoal"}</p>
      </div>
      {children}
    </li>
  );
}

export function TransactionList({ items }: { items: Transaction[] }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">Nenhuma transação ainda.</p>;
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <TransactionRow key={t.id} t={t} />
      ))}
    </ul>
  );
}
