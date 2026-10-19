import { formatBRL } from "@/lib/format";
import type { Account } from "@/lib/types";

function BrandMark({ brand }: { brand: string }) {
  if (brand === "mastercard")
    return (
      <span className="flex" aria-label="Mastercard">
        <span className="h-5 w-5 rounded-full bg-red-500/90" />
        <span className="-ml-2 h-5 w-5 rounded-full bg-amber-400/90" />
      </span>
    );
  return <span className="text-lg font-black italic tracking-tight">{brand === "visa" ? "VISA" : brand.toUpperCase()}</span>;
}

export function AccountCards({ accounts, balances }: { accounts: Account[]; balances: Map<string, number> }) {
  const sorted = [...accounts].sort((a, b) => (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0));
  const [front, ...rest] = sorted;
  const behind = rest.slice(0, 2).reverse();
  if (!front) return <p className="py-10 text-center text-sm text-muted">Nenhuma conta neste filtro ainda.</p>;

  return (
    <div className="relative pt-2">
      {behind.map((a, i) => (
        <div
          key={a.id}
          className="mx-auto flex h-12 items-start justify-between rounded-t-2xl border border-white/10 bg-gradient-to-b from-[#6b4228] to-[#3a2417] px-4 pt-2 text-xs text-white/70"
          style={{ width: `${86 + i * 7}%`, marginBottom: -16 }}
        >
          <span className="flex items-center gap-2">
            <BrandMark brand={a.brand} /> {a.name}
          </span>
          <span>{formatBRL(balances.get(a.id) ?? 0)}</span>
        </div>
      ))}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#2d221c] via-[#1b1512] to-[#120e0c] p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <BrandMark brand={front.brand} />
            <p className="mt-1 text-xs text-muted">
              {front.name}
              {front.last4 ? ` •••• ${front.last4}` : ""}
            </p>
          </div>
          <span className="h-9 w-12 rounded-md bg-gradient-to-br from-zinc-200 to-zinc-400 opacity-90" aria-hidden />
        </div>
        <p className="mt-6 text-sm text-muted">Saldo · {front.scope === "casal" ? "Casal" : "Pessoal"}</p>
        <p className="text-3xl font-light tracking-tight">{formatBRL(balances.get(front.id) ?? 0)}</p>
      </div>
    </div>
  );
}
