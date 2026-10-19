const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatBRL(value: number): string {
  return brl.format(value);
}

export function formatCompactBRL(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `R$${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  return `R$${Math.round(value)}`;
}

export function formatPercent(value: number): string {
  return `${pct.format(value)}%`;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function monthLabel(isoMonth: string): string {
  const m = Number(isoMonth.slice(5, 7));
  return MONTHS[m - 1] ?? isoMonth;
}

/** "2026-01-20" -> "20 jan 2026" */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
