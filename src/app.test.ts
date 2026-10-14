import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app";
import products from "../data/products.json";
import expected from "../data/expected.json";

describe("POST /reprice", () => {
  it("returns 200 and results in the same order as the input", async () => {
    const res = await request(app).post("/reprice").send(products);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expected);
  });

  it("returns an empty array for an empty array", async () => {
    const res = await request(app).post("/reprice").send([]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 400 when the body is not an array", async () => {
    const res = await request(app).post("/reprice").send({ sku: "X" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/reprice")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
  });

  it("returns 400 and the index of an invalid product", async () => {
    const res = await request(app)
      .post("/reprice")
      .send([products[0], { sku: "BROKEN" }]);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("index 1");
  });
});