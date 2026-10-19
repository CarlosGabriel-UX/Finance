"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { parseScope } from "@/lib/scope";
import type { ScopeFilter } from "@/lib/types";

const OPTIONS: { id: ScopeFilter; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "pessoal", label: "Pessoal" },
  { id: "casal", label: "Casal" },
];

export function ScopeTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = parseScope(params.get("v"));
  return (
    <div className="flex rounded-full border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Visão">
      {OPTIONS.map((o) => {
        const next = new URLSearchParams(params);
        if (o.id === "tudo") next.delete("v");
        else next.set("v", o.id);
        const qs = next.toString();
        return (
          <Link
            key={o.id}
            role="tab"
            aria-selected={current === o.id}
            href={qs ? `${pathname}?${qs}` : pathname}
            className={`chip ${current === o.id ? "chip-active" : ""}`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
