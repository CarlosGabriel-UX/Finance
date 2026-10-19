/** Converte valores digitados como "1.234,56", "1234.56" ou "R$ 1234,5" em número positivo. */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[R$\s]/g, "");
  const thousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(cleaned);
  const normalized = cleaned.includes(",") || thousandsOnly ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const n = Number(normalized);
  if (!cleaned || !Number.isFinite(n) || n <= 0) throw new Error("Informe um valor maior que zero.");
  return Math.round(n * 100) / 100;
}
