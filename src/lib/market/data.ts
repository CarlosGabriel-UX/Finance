import "server-only";
import { analyzeStock, equitySignal, fixedIncomeSignals, realRate, type Signal, type StockAnalysis } from "./signals";

// Fontes gratuitas:
// - Banco Central (SGS e Focus): Selic, IPCA e expectativas.
// - Yahoo Finance (gráfico diário); brapi.dev como alternativa quando BRAPI_TOKEN existe.

const REVALIDATE = 60 * 60; // 1 hora

export const WATCHLIST = [
  { ticker: "BOVA11", name: "ETF Ibovespa" },
  { ticker: "PETR4", name: "Petrobras" },
  { ticker: "VALE3", name: "Vale" },
  { ticker: "ITUB4", name: "Itaú Unibanco" },
  { ticker: "BBAS3", name: "Banco do Brasil" },
  { ticker: "WEGE3", name: "WEG" },
  { ticker: "TAEE11", name: "Taesa" },
] as const;

export interface Rates {
  selic: number;
  selic6mAgo: number | null;
  ipca12m: number;
  selicExpected: number | null;
  realRate: number;
}

export interface StockRow {
  ticker: string;
  name: string;
  analysis: StockAnalysis;
}

export interface MarketSnapshot {
  rates: Rates | null;
  fixedIncome: Signal[];
  equity: Signal | null;
  ibovHistory: { date: string; close: number }[];
  stocks: StockRow[];
  errors: string[];
  updatedAt: string;
}

function brDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE },
    headers: { "User-Agent": "Mozilla/5.0 (financas-do-casal)", Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${res.status} em ${new URL(url).host}`);
  return (await res.json()) as T;
}

type SgsPoint = { data: string; valor: string };
const sgsValue = (p: SgsPoint) => Number(p.valor.replace(",", "."));

async function fetchSgs(series: number, from: Date, to: Date) {
  return getJSON<SgsPoint[]>(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados?formato=json&dataInicial=${brDate(from)}&dataFinal=${brDate(to)}`,
  );
}

export async function fetchRates(today = new Date()): Promise<Rates> {
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  // 432 = meta Selic (% a.a.), 13522 = IPCA acumulado em 12 meses.
  const [selicSeries, ipcaSeries, expected] = await Promise.all([
    fetchSgs(432, new Date(sixMonthsAgo.getTime() - 15 * 86400000), today),
    fetchSgs(13522, yearAgo, today),
    fetchSelicExpectation(today.getFullYear() + 1).catch(() => null),
  ]);
  if (!selicSeries.length || !ipcaSeries.length) throw new Error("séries do Banco Central vazias");
  const selic = sgsValue(selicSeries[selicSeries.length - 1]!);
  const ipca12m = sgsValue(ipcaSeries[ipcaSeries.length - 1]!);
  return {
    selic,
    selic6mAgo: sgsValue(selicSeries[0]!),
    ipca12m,
    selicExpected: expected,
    realRate: realRate(selic, ipca12m),
  };
}

async function fetchSelicExpectation(year: number): Promise<number | null> {
  const params = new URLSearchParams({
    $top: "1",
    $filter: `Indicador eq 'Selic' and DataReferencia eq '${year}'`,
    $orderby: "Data desc",
    $select: "Data,Mediana",
    $format: "json",
  });
  const data = await getJSON<{ value: { Mediana: number }[] }>(
    `https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?${params.toString().replace(/\+/g, "%20")}`,
  );
  return data.value[0]?.Mediana ?? null;
}

interface YahooChart {
  chart: { result: { timestamp: number[]; indicators: { quote: { close: (number | null)[] }[] } }[] | null };
}
interface BrapiQuote {
  results: { historicalDataPrice: { date: number; close: number | null }[] }[];
}

export async function fetchHistory(symbol: string): Promise<{ date: string; close: number }[]> {
  const yahooSymbol = symbol.startsWith("^") ? symbol : `${symbol}.SA`;
  try {
    const data = await getJSON<YahooChart>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1y&interval=1d`,
    );
    const r = data.chart.result?.[0];
    if (!r) throw new Error(`sem dados para ${symbol}`);
    const closes = r.indicators.quote[0]?.close ?? [];
    return r.timestamp
      .map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] }))
      .filter((p): p is { date: string; close: number } => typeof p.close === "number");
  } catch (err) {
    const token = process.env.BRAPI_TOKEN;
    if (!token) throw err;
    const data = await getJSON<BrapiQuote>(
      `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?range=1y&interval=1d&token=${encodeURIComponent(token)}`,
    );
    return (data.results[0]?.historicalDataPrice ?? [])
      .filter((p): p is { date: number; close: number } => typeof p.close === "number")
      .map((p) => ({ date: new Date(p.date * 1000).toISOString().slice(0, 10), close: p.close }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const errors: string[] = [];
  const [ratesResult, ibovResult, ...stockResults] = await Promise.allSettled([
    fetchRates(),
    fetchHistory("^BVSP"),
    ...WATCHLIST.map((s) => fetchHistory(s.ticker)),
  ]);

  const rates = ratesResult.status === "fulfilled" ? ratesResult.value : null;
  if (!rates) errors.push("Não foi possível consultar Selic e IPCA no Banco Central agora.");

  const ibovHistory = ibovResult.status === "fulfilled" ? ibovResult.value : [];
  const ibov = analyzeStock(ibovHistory.map((p) => p.close));
  if (!ibov) errors.push("Não foi possível consultar o histórico do Ibovespa agora.");

  const stocks: StockRow[] = [];
  stockResults.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const analysis = analyzeStock(r.value.map((p) => p.close));
    if (analysis) stocks.push({ ...WATCHLIST[i]!, analysis });
  });
  if (!stocks.length) errors.push("Não foi possível consultar as cotações das ações agora.");

  return {
    rates,
    fixedIncome: rates ? fixedIncomeSignals(rates) : [],
    equity: ibov ? equitySignal(ibov, rates?.realRate ?? null) : null,
    ibovHistory,
    stocks: stocks.sort((a, b) => b.analysis.score - a.analysis.score),
    errors,
    updatedAt: new Date().toISOString(),
  };
}
