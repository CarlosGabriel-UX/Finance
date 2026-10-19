import { describe, expect, it } from "vitest";
import { analyzeStock, equitySignal, fixedIncomeSignals, realRate, rsi, sma } from "./signals";

const range = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));

describe("indicators", () => {
  it("sma", () => {
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
    expect(sma([1], 2)).toBeNull();
  });

  it("rsi is 100 on a steady climb and low on a steady fall", () => {
    expect(rsi(range(30, (i) => 10 + i))).toBe(100);
    expect(rsi(range(30, (i) => 100 - i))!).toBeLessThan(1);
  });

  it("real rate uses Fisher", () => {
    expect(realRate(15, 5)).toBeCloseTo(9.5238, 3);
  });
});

describe("analyzeStock", () => {
  it("flags an overbought rally near the high as caution", () => {
    const a = analyzeStock(range(260, (i) => 100 + i * 0.5))!;
    expect(a.rsi14).toBe(100);
    expect(a.rating).toBe("cautela");
  });

  it("flags a deep, oversold dip in an uptrend as favourable", () => {
    const closes = [...range(240, (i) => 100 + i * 0.3), ...range(20, (i) => 172 - i * 1.5)];
    const a = analyzeStock(closes)!;
    expect(a.drawdownPct).toBeGreaterThan(15);
    expect(a.rsi14!).toBeLessThan(30);
    expect(a.rating).toBe("favoravel");
  });

  it("needs enough history", () => {
    expect(analyzeStock([1, 2, 3])).toBeNull();
  });
});

describe("fixedIncomeSignals", () => {
  it("high Selic with expected cuts favours post-fixed, prefixed and IPCA+", () => {
    const [pos, pre, ipca] = fixedIncomeSignals({ selic: 15, selic6mAgo: 15, ipca12m: 5, selicExpected: 12.5 });
    expect(pos!.rating).toBe("favoravel");
    expect(pre!.rating).toBe("favoravel");
    expect(ipca!.rating).toBe("favoravel");
  });

  it("rising rates call for caution on prefixed", () => {
    const [, pre] = fixedIncomeSignals({ selic: 12, selic6mAgo: 10.5, ipca12m: 4.5, selicExpected: 13 });
    expect(pre!.rating).toBe("cautela");
  });

  it("low real rate is not attractive for IPCA+", () => {
    const [pos, , ipca] = fixedIncomeSignals({ selic: 6, selic6mAgo: 6, ipca12m: 4, selicExpected: null });
    expect(pos!.rating).toBe("cautela");
    expect(ipca!.rating).toBe("cautela");
  });
});

describe("equitySignal", () => {
  it("high real rate pushes the equity signal down", () => {
    const neutral = analyzeStock(range(260, (i) => 100 + Math.sin(i / 5) * 3))!;
    expect(equitySignal({ ...neutral, score: 0 }, 9).rating).toBe("cautela");
    expect(equitySignal({ ...neutral, score: 0 }, 2).rating).toBe("favoravel");
  });
});
