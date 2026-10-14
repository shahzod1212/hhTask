import { describe, it, expect } from "vitest";
import { calculatePrice } from "./pricing";
import type { Product, Reason } from "./types";
import products from "../data/products.json";
import expected from "../data/expected.json";

const mk = (over: Partial<Product>): Product => ({
  sku: "X",
  name: "X",
  myPrice: 1000,
  minPrice: 0,
  maxPrice: 1_000_000,
  step: 0,
  competitors: [],
  ...over,
});
const c = (price: number, inStock = true) => ({ seller: "s", price, inStock });

type Case = [
  best: number,
  step: number,
  min: number,
  max: number,
  price: number,
  reason: Reason,
];

const cases: Case[] = [
  [384990, 10, 370000, 420000, 384980, "UNDERCUT"],
  [175000, 100, 180000, 210000, 180000, "AT_MIN"],
  [150000, 1, 100000, 125000, 125000, "AT_MAX"],
  [349999.9, 0.5, 330000, 380000, 349999, "UNDERCUT"],
];

describe("calculatePrice", () => {
  it("matches data/expected.json", () => {
    expect((products as Product[]).map(calculatePrice)).toEqual(expected);
  });

  it.each(cases)("best=%d step=%d", (best, step, min, max, price, reason) => {
    const r = calculatePrice(
      mk({ step, minPrice: min, maxPrice: max, competitors: [c(best)] }),
    );
    expect(r).toMatchObject({ newPrice: price, reason });
  });

  it("only out-of-stock competitors -> maxPrice", () => {
    const r = calculatePrice(
      mk({ maxPrice: 99990, step: 50, competitors: [c(1, false)] }),
    );
    expect(r).toMatchObject({ newPrice: 99990, reason: "NO_COMPETITORS" });
  });

  it("empty competitors list -> maxPrice", () => {
    const r = calculatePrice(mk({ maxPrice: 60000 }));
    expect(r).toMatchObject({ newPrice: 60000, reason: "NO_COMPETITORS" });
  });

  it("ignores a cheaper out-of-stock competitor", () => {
    const r = calculatePrice(
      mk({ step: 10, competitors: [c(100, false), c(500)] }),
    );
    expect(r).toMatchObject({ newPrice: 490, reason: "UNDERCUT" });
  });

  it("tie on the minimum price", () => {
    const r = calculatePrice(
      mk({ step: 10, competitors: [c(500), c(500), c(700)] }),
    );
    expect(r.newPrice).toBe(490);
  });

  it("candidate == minPrice is UNDERCUT, not AT_MIN", () => {
    const r = calculatePrice(
      mk({ step: 10, minPrice: 490, competitors: [c(500)] }),
    );
    expect(r).toMatchObject({ newPrice: 490, reason: "UNDERCUT" });
  });

  it("candidate == maxPrice is UNDERCUT, not AT_MAX", () => {
    const r = calculatePrice(
      mk({ step: 10, maxPrice: 490, competitors: [c(500)] }),
    );
    expect(r).toMatchObject({ newPrice: 490, reason: "UNDERCUT" });
  });

  it("step = 0 matches the competitor price", () => {
    const r = calculatePrice(mk({ step: 0, competitors: [c(500)] }));
    expect(r.newPrice).toBe(500);
  });

  it("min === max always returns that price", () => {
    const r = calculatePrice(
      mk({ minPrice: 500, maxPrice: 500, step: 10, competitors: [c(1000)] }),
    );
    expect(r.newPrice).toBe(500);
  });

  it("float noise: 2.3 - 0.3 -> 2", () => {
    const r = calculatePrice(mk({ step: 0.3, competitors: [c(2.3)] }));
    expect(r.newPrice).toBe(2);
  });

  it("myPrice does not affect the result, only oldPrice", () => {
    const a = calculatePrice(mk({ myPrice: 1, step: 10, competitors: [c(500)] }));
    const b = calculatePrice(
      mk({ myPrice: 999999, step: 10, competitors: [c(500)] }),
    );
    expect(a.newPrice).toBe(b.newPrice);
    expect(a.oldPrice).toBe(1);
    expect(b.oldPrice).toBe(999999);
  });

  it("does not mutate the input", () => {
    const p = mk({ step: 10, competitors: [c(500), c(300, false)] });
    const snapshot = structuredClone(p);
    calculatePrice(p);
    expect(p).toEqual(snapshot);
  });
});