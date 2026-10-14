import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // allow importing ../data/products.json and ../src/types.ts from the repo root
    fs: { allow: [".."] },
    // forward /reprice to the Express server, so no CORS setup is needed
    proxy: { "/reprice": "http://localhost:3001" },
  },
});