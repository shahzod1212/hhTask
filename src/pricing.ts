import type { Product, PriceResult } from "./types";

const EPS = 1e-9;

/**
 * Чистая функция: рассчитывает новую цену для одного товара.
 * Правила — см. README, раздел «Правила расчёта цены».
 */
export function calculatePrice(product: Product): PriceResult {
  const { sku, myPrice, minPrice, maxPrice, step, competitors } = product;
  const base = { sku, oldPrice: myPrice };

  const prices = competitors.filter((c) => c.inStock).map((c) => c.price);
  if (prices.length === 0) {
    return { ...base, newPrice: maxPrice, reason: "NO_COMPETITORS" };
  }

  const best = prices.reduce((a, b) => Math.min(a, b));
  const candidate = floorSafe(best - step);

  if (candidate < minPrice) return { ...base, newPrice: minPrice, reason: "AT_MIN" };
  if (candidate > maxPrice) return { ...base, newPrice: maxPrice, reason: "AT_MAX" };
  return { ...base, newPrice: candidate, reason: "UNDERCUT" };
}

// Math.floor, but a value like 1.9999999999999998 (float noise) counts as 2
function floorSafe(x: number): number {
  const r = Math.round(x);
  return Math.abs(x - r) < EPS ? r : Math.floor(x);
}