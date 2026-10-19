// Indicadores técnicos e regras simples para sugerir bons momentos de aporte.
// São heurísticas educativas, não recomendação de investimento.

export type Rating = "favoravel" | "neutro" | "cautela";

export interface Signal {
  title: string;
  rating: Rating;
  summary: string;
  reasons: string[];
}

export function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i]!;
  return sum / period;
}

/** RSI de Wilder. */
export function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i]! - values[i - 1]!;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i]! - values[i - 1]!;
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function realRate(nominalPct: number, inflationPct: number): number {
  return ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;
}

export interface StockAnalysis {
  price: number;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  /** Queda (%) em relação à máxima das últimas ~52 semanas. */
  drawdownPct: number;
  /** Variação (%) nos últimos ~21 pregões. */
  change1mPct: number | null;
  score: number;
  rating: Rating;
  reasons: string[];
}

const fmt = (n: number, digits = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export function analyzeStock(closes: number[]): StockAnalysis | null {
  if (closes.length < 30) return null;
  const price = closes[closes.length - 1]!;
  const s50 = sma(closes, 50);
  const s200 = sma(closes, 200);
  const r = rsi(closes, 14);
  const high = Math.max(...closes.slice(-252));
  const drawdownPct = ((high - price) / high) * 100;
  const prev = closes.length > 21 ? closes[closes.length - 22]! : null;
  const change1mPct = prev ? ((price - prev) / prev) * 100 : null;

  let score = 0;
  const reasons: string[] = [];
  if (s200 !== null) {
    if (price > s200) {
      score += 1;
      reasons.push(`Preço acima da média de 200 dias: tendência de longo prazo positiva.`);
    } else {
      score -= 1;
      reasons.push(`Preço abaixo da média de 200 dias: tendência de longo prazo negativa.`);
    }
  }
  if (r !== null) {
    if (r < 30) {
      score += 1;
      reasons.push(`IFR(14) em ${fmt(r, 0)}: ativo sobrevendido, quedas recentes exageradas.`);
    } else if (r > 70) {
      score -= 1;
      reasons.push(`IFR(14) em ${fmt(r, 0)}: ativo sobrecomprado, subiu rápido demais.`);
    } else {
      reasons.push(`IFR(14) em ${fmt(r, 0)}: zona neutra.`);
    }
  }
  if (drawdownPct >= 15) {
    score += 1;
    reasons.push(`Negociando ${fmt(drawdownPct)}% abaixo da máxima de 52 semanas.`);
  } else if (drawdownPct < 3 && r !== null && r > 65) {
    score -= 1;
    reasons.push(`Colado na máxima de 52 semanas: pouco desconto agora.`);
  }

  return { price, sma50: s50, sma200: s200, rsi14: r, drawdownPct, change1mPct, score, rating: ratingFor(score), reasons };
}

function ratingFor(score: number): Rating {
  if (score >= 1) return "favoravel";
  if (score <= -1) return "cautela";
  return "neutro";
}

export interface RatesInput {
  /** Meta Selic atual (% a.a.). */
  selic: number;
  /** Meta Selic ~6 meses atrás (% a.a.). */
  selic6mAgo: number | null;
  /** IPCA acumulado em 12 meses (%). */
  ipca12m: number;
  /** Mediana Focus para a Selic no fim do próximo ano (% a.a.). */
  selicExpected: number | null;
}

export function fixedIncomeSignals(input: RatesInput): Signal[] {
  const { selic, selic6mAgo, ipca12m, selicExpected } = input;
  const real = realRate(selic, ipca12m);
  const trend = selic6mAgo === null ? "estavel" : selic > selic6mAgo + 0.2 ? "alta" : selic < selic6mAgo - 0.2 ? "queda" : "estavel";
  const cutsExpected = selicExpected !== null && selicExpected < selic - 0.5;
  const hikesExpected = selicExpected !== null && selicExpected > selic + 0.25;

  const pos: Signal = {
    title: "Pós-fixados (Tesouro Selic, CDB/LCI de CDI)",
    rating: selic >= 10 ? "favoravel" : selic >= 7 ? "neutro" : "cautela",
    summary:
      selic >= 10
        ? "Selic alta: o CDI rende bem com baixo risco. Ótimo para reserva de emergência e objetivos de curto prazo."
        : "Selic moderada: pós-fixados seguem bons para a reserva, mas rendem menos.",
    reasons: [`Meta Selic em ${fmt(selic, 2)}% a.a.`, `Juro real (Selic − IPCA 12m) de ${fmt(real, 2)}% a.a.`],
  };

  const preReasons = [`Selic ${trendText(trend)} nos últimos 6 meses.`];
  if (selicExpected !== null) preReasons.push(`Mercado (Focus) projeta Selic de ${fmt(selicExpected, 2)}% no fim do próximo ano.`);
  let preRating: Rating = "neutro";
  let preSummary = "Sem sinal claro de virada dos juros. Prefixados podem compor a carteira com prazos que casem com seus objetivos.";
  if (cutsExpected || (trend === "queda" && !hikesExpected)) {
    preRating = "favoravel";
    preSummary = "Juros devem cair: travar uma taxa prefixada agora tende a render mais que o CDI no futuro.";
  } else if (hikesExpected || trend === "alta") {
    preRating = "cautela";
    preSummary = "Juros ainda subindo: vale esperar o ciclo de alta terminar antes de travar taxas prefixadas.";
  }

  const ipca: Signal = {
    title: "Tesouro IPCA+ / títulos atrelados à inflação",
    rating: real >= 6 ? "favoravel" : real >= 4 ? "neutro" : "cautela",
    summary:
      real >= 6
        ? "Juro real acima de 6% a.a. é historicamente alto: bom momento para proteger o poder de compra no longo prazo."
        : real >= 4
          ? "Juro real razoável. IPCA+ segue interessante para objetivos longos, como aposentadoria."
          : "Juro real baixo: o ganho acima da inflação está menos atrativo agora.",
    reasons: [`IPCA acumulado em 12 meses: ${fmt(ipca12m, 2)}%.`, `Juro real estimado: ${fmt(real, 2)}% a.a.`],
  };

  return [pos, { title: "Prefixados (Tesouro Prefixado, CDB pré)", rating: preRating, summary: preSummary, reasons: preReasons }, ipca];
}

function trendText(trend: "alta" | "queda" | "estavel") {
  return trend === "alta" ? "em alta" : trend === "queda" ? "em queda" : "estável";
}

/** Sinal geral para a bolsa, combinando o Ibovespa com o juro real disponível na renda fixa. */
export function equitySignal(ibov: StockAnalysis, realRatePct: number | null): Signal {
  let score = ibov.score;
  const reasons = [...ibov.reasons];
  if (realRatePct !== null) {
    if (realRatePct >= 7) {
      score -= 1;
      reasons.push(`Juro real de ${fmt(realRatePct, 2)}% a.a. torna a renda fixa uma forte concorrente da bolsa.`);
    } else if (realRatePct <= 3) {
      score += 1;
      reasons.push(`Juro real baixo (${fmt(realRatePct, 2)}% a.a.) favorece a renda variável.`);
    }
  }
  const rating = ratingFor(score);
  const summary =
    rating === "favoravel"
      ? "Bolsa com bons sinais para aportes. Prefira aportes regulares e diversificados (ex.: ETFs como BOVA11)."
      : rating === "cautela"
        ? "Bolsa esticada ou com juros competindo forte. Mantenha aportes pequenos e regulares, sem pressa."
        : "Sinais mistos. Siga aportando aos poucos (preço médio) sem tentar acertar o fundo.";
  return { title: "Ações (Ibovespa)", rating, summary, reasons };
}
