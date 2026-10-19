import { ArrowDown, ArrowUp } from "lucide-react";
import { formatPercent } from "@/lib/format";

export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${up ? "text-up" : "text-down"} ${className}`}>
      <Icon size={14} strokeWidth={2.5} />
      {formatPercent(Math.abs(value))}
    </span>
  );
}
