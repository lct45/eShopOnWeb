import { describe, expect, it } from "vitest";
import { CATALOG_SCHEMA_SQL, IDENTITY_SCHEMA_SQL } from "./schema";

describe("SQL Server seed schema scripts", () => {
  it("targets SQL Server (not PostgreSQL) dialect constructs", () => {
    const combined = `${CATALOG_SCHEMA_SQL}\n${IDENTITY_SCHEMA_SQL}`;
    expect(combined).toContain("OBJECT_ID");
    expect(combined).toContain("NVARCHAR");
    expect(combined).toContain("CREATE SEQUENCE");
    expect(combined).not.toMatch(/\bSERIAL\b/);
    expect(combined).not.toMatch(/\bJSONB\b/i);
    expect(combined).not.toMatch(/\bUUID\b/);
  });

  it("creates catalog, identity, basket, and order tables used by tests", () => {
    expect(CATALOG_SCHEMA_SQL).toContain("CatalogBrands");
    expect(CATALOG_SCHEMA_SQL).toContain("CatalogTypes");
    expect(CATALOG_SCHEMA_SQL).toContain("dbo.Catalog");
    expect(CATALOG_SCHEMA_SQL).toContain("Baskets");
    expect(CATALOG_SCHEMA_SQL).toContain("Orders");
    expect(IDENTITY_SCHEMA_SQL).toContain("AspNetUsers");
    expect(IDENTITY_SCHEMA_SQL).toContain("AspNetRoles");
    expect(IDENTITY_SCHEMA_SQL).toContain("AspNetUserRoles");
  });
});
