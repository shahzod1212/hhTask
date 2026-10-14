import express from "express";
import type { NextFunction, Request, Response } from "express";
import { calculatePrice } from "./pricing";
import type { Competitor, Product } from "./types";

function isNonNegative(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0;
}

function isCompetitor(x: unknown): x is Competitor {
  if (typeof x !== "object" || x === null) return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.seller === "string" &&
    isNonNegative(c.price) &&
    typeof c.inStock === "boolean"
  );
}

function isProduct(x: unknown): x is Product {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.sku === "string" &&
    typeof p.name === "string" &&
    isNonNegative(p.myPrice) &&
    isNonNegative(p.minPrice) &&
    Number.isInteger(p.minPrice) &&
    isNonNegative(p.maxPrice) &&
    Number.isInteger(p.maxPrice) &&
    p.minPrice <= p.maxPrice &&
    isNonNegative(p.step) &&
    Array.isArray(p.competitors) &&
    p.competitors.every(isCompetitor)
  );
}

export const app = express();

app.use(express.json());

app.post("/reprice", (req: Request, res: Response) => {
  const body: unknown = req.body;

  if (!Array.isArray(body)) {
    res.status(400).json({ error: "Body must be an array of products" });
    return;
  }

  const badIndex = body.findIndex((item) => !isProduct(item));
  if (badIndex !== -1) {
    res.status(400).json({ error: `Invalid product at index ${badIndex}` });
    return;
  }

  res.json((body as Product[]).map(calculatePrice));
});

// Malformed JSON makes express.json() throw a SyntaxError -> answer 400, not 500
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});