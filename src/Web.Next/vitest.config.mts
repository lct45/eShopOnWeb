import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
  },
  resolve: {
    alias: {
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/domain": path.resolve(__dirname, "./src/domain"),
      "@/data": path.resolve(__dirname, "./src/data"),
      "@/auth": path.resolve(__dirname, "./src/auth"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
