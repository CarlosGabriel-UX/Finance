import { describe, expect, it } from "vitest";
import { parseAmount } from "./parse";

describe("parseAmount", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1234,5", 1234.5],
    ["1234.56", 1234.56],
    ["R$ 25", 25],
    ["1.500", 1500],
    ["0,1", 0.1],
  ])("parses %s", (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it.each(["", "abc", "0", "-10"])("rejects %s", (raw) => {
    expect(() => parseAmount(raw)).toThrow();
  });
});
