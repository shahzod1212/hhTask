import { useEffect, useState } from "react";
import "./App.css";
import productsData from "../../data/products.json";
import type { PriceResult, Product, Reason } from "../../src/types";

const products = productsData as Product[];
const nameBySku = new Map(products.map((p) => [p.sku, p.name]));

const REASON_LABELS: Record<Reason, string> = {
  UNDERCUT: "Undercut competitor",
  AT_MIN: "Hit minimum price",
  AT_MAX: "Hit maximum price",
  NO_COMPETITORS: "No competitors in stock",
};

const formatPrice = (value: number): string =>
  `${value.toLocaleString("ru-RU")} ₸`;

export default function App() {
  const [results, setResults] = useState<PriceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/reprice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(products),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json() as Promise<PriceResult[]>;
      })
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) return <p className="status">Loading…</p>;
  if (error) {
    return (
      <p className="status error">
        Could not load prices: {error}. Is the server running on port 3001?
      </p>
    );
  }

  return (
    <main>
      <h1>SaleScout repricer</h1>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th className="num">Old price</th>
            <th className="num">New price</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.sku}
              className={r.newPrice !== r.oldPrice ? "changed" : ""}
            >
              <td>{r.sku}</td>
              <td>{nameBySku.get(r.sku) ?? "—"}</td>
              <td className="num">{formatPrice(r.oldPrice)}</td>
              <td className="num">{formatPrice(r.newPrice)}</td>
              <td>
                <span className={`badge ${r.reason}`}>
                  {REASON_LABELS[r.reason]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
