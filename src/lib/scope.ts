import type { ScopeFilter } from "./types";

export function parseScope(value: string | undefined | null): ScopeFilter {
  return value === "pessoal" || value === "casal" ? value : "tudo";
}

export const SCOPE_LABEL: Record<ScopeFilter, string> = { tudo: "Tudo", pessoal: "Pessoal", casal: "Casal" };
