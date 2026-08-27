import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../../../..");
const webNextRoot = resolve(__dirname, "../..");

describe("Next.js Dockerfile (LCFM-26)", () => {
  const dockerfile = readFileSync(resolve(webNextRoot, "Dockerfile"), "utf8");

  it("uses a multi-stage build with a lean runtime stage", () => {
    expect(dockerfile).toMatch(/FROM node:22-alpine AS deps/);
    expect(dockerfile).toMatch(/FROM node:22-alpine AS builder/);
    expect(dockerfile).toMatch(/FROM node:22-alpine AS runner/);
    expect(dockerfile).toMatch(/CMD \["node", "server\.js"\]/);
  });

  it("does not install build tooling in the runtime stage", () => {
    const runnerSection = dockerfile.split("AS runner")[1] ?? "";
    expect(runnerSection).not.toMatch(/\bnpm ci\b/);
    expect(runnerSection).not.toMatch(/\bnpm install\b/);
    expect(runnerSection).not.toMatch(/\bnpm run build\b/);
    expect(runnerSection).not.toMatch(/\btypescript\b/i);
  });
});

describe("docker compose orchestration (LCFM-26)", () => {
  const compose = readFileSync(resolve(repoRoot, "docker-compose.yml"), "utf8");
  const envExample = readFileSync(resolve(repoRoot, ".env.example"), "utf8");

  it("runs web-next and sqlserver with health checks and a data volume", () => {
    expect(compose).toMatch(/^\s*web-next:/m);
    expect(compose).toMatch(/^\s*sqlserver:/m);
    expect(compose).toMatch(/condition:\s*service_healthy/);
    expect(compose).toMatch(/eshop-mssql-data:/);
    expect(compose).toMatch(/\/api\/health/);
    expect(compose).toMatch(/MSSQL_SA_PASSWORD:\s*\$\{MSSQL_SA_PASSWORD\}/);
  });

  it("does not commit hard-coded database passwords", () => {
    expect(compose).not.toMatch(/SA_PASSWORD=@someThingComplicated1234/);
    expect(compose).not.toMatch(/Password=@someThingComplicated1234/);
    expect(compose).not.toMatch(/MSSQL_SA_PASSWORD:\s*[^$\s{]/);
  });

  it("documents secrets via .env.example without using the old committed password", () => {
    expect(existsSync(resolve(repoRoot, ".env.example"))).toBe(true);
    expect(envExample).toMatch(/MSSQL_SA_PASSWORD=/);
    expect(envExample).toMatch(/CATALOG_CONNECTION_STRING=/);
    expect(envExample).toMatch(/IDENTITY_CONNECTION_STRING=/);
    expect(envExample).not.toContain("@someThingComplicated1234");
  });

  it("ships local runbook documentation", () => {
    const docs = readFileSync(
      resolve(repoRoot, "docs/docker-local-nextjs.md"),
      "utf8",
    );
    expect(docs).toMatch(/Clean start/i);
    expect(docs).toMatch(/Seed/i);
    expect(docs).toMatch(/Troubleshooting/i);
  });
});
