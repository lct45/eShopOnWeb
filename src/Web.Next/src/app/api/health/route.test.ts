import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("GET /api/health", () => {
  it("returns healthy JSON and never echoes connection strings", async () => {
    process.env.CATALOG_CONNECTION_STRING =
      "Server=sqlserver;Password=do-not-leak;";
    process.env.IDENTITY_CONNECTION_STRING =
      "Server=sqlserver;Password=do-not-leak;";

    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      service: string;
      databaseConfigured: boolean;
    };

    expect(body).toEqual({
      status: "ok",
      service: "web-next",
      databaseConfigured: true,
    });
    expect(JSON.stringify(body)).not.toContain("do-not-leak");
  });

  it("reports databaseConfigured false when env is incomplete", async () => {
    delete process.env.CATALOG_CONNECTION_STRING;
    delete process.env.IDENTITY_CONNECTION_STRING;

    const response = await GET();
    const body = (await response.json()) as { databaseConfigured: boolean };
    expect(body.databaseConfigured).toBe(false);
  });
});
