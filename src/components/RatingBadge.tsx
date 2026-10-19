import type { Rating } from "@/lib/market/signals";

const STYLES: Record<Rating, { label: string; className: string }> = {
  favoravel: { label: "Bom momento", className: "bg-up/15 text-up" },
  neutro: { label: "Neutro", className: "bg-white/10 text-ink" },
  cautela: { label: "Cautela", className: "bg-down/15 text-down" },
};

export function RatingBadge({ rating }: { rating: Rating }) {
  const s = STYLES[rating];
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}
