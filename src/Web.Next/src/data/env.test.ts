import { describe, expect, it } from "vitest";
import { getDatabaseEnv, getDatabaseHealthSummary } from "@/data/env";

describe("getDatabaseEnv", () => {
  it("reports configured when both connection strings are present", () => {
    const env = getDatabaseEnv({
      CATALOG_CONNECTION_STRING:
        "Server=sqlserver,1433;Database=Microsoft.eShopOnWeb.CatalogDb;User Id=sa;Password=secret;",
      IDENTITY_CONNECTION_STRING:
        "Server=sqlserver,1433;Database=Microsoft.eShopOnWeb.Identity;User Id=sa;Password=secret;",
    });

    expect(env.isConfigured).toBe(true);
    expect(env.catalogConnectionString).toContain("CatalogDb");
    expect(env.identityConnectionString).toContain("Identity");
  });

  it("reports not configured when either string is missing", () => {
    expect(
      getDatabaseEnv({
        CATALOG_CONNECTION_STRING: "Server=sqlserver,1433;",
      }).isConfigured,
    ).toBe(false);

    expect(getDatabaseEnv({}).isConfigured).toBe(false);
  });

  it("trims whitespace-only values to undefined", () => {
    const env = getDatabaseEnv({
      CATALOG_CONNECTION_STRING: "   ",
      IDENTITY_CONNECTION_STRING: "\t",
    });

    expect(env.catalogConnectionString).toBeUndefined();
    expect(env.identityConnectionString).toBeUndefined();
    expect(env.isConfigured).toBe(false);
  });
});

describe("getDatabaseHealthSummary", () => {
  it("exposes only a boolean flag (no connection strings)", () => {
    const summary = getDatabaseHealthSummary({
      CATALOG_CONNECTION_STRING:
        "Server=sqlserver;Password=super-secret-value;",
      IDENTITY_CONNECTION_STRING:
        "Server=sqlserver;Password=super-secret-value;",
    });

    expect(summary).toEqual({ databaseConfigured: true });
    expect(JSON.stringify(summary)).not.toContain("super-secret-value");
  });
});
