import { describe, expect, it } from "vitest";
import { resolveSeedConnectionStrings } from "./connection";

describe("seed connection resolution", () => {
  it("builds catalog/identity strings from ESHOP_SQLSERVER", () => {
    const previous = {
      catalog: process.env.ESHOP_CATALOG_CONNECTION,
      identity: process.env.ESHOP_IDENTITY_CONNECTION,
      server: process.env.ESHOP_SQLSERVER,
      legacyCatalog: process.env.CatalogConnection,
      legacyIdentity: process.env.IdentityConnection,
    };

    delete process.env.ESHOP_CATALOG_CONNECTION;
    delete process.env.ESHOP_IDENTITY_CONNECTION;
    delete process.env.CatalogConnection;
    delete process.env.IdentityConnection;
    process.env.ESHOP_SQLSERVER =
      "Server=localhost,1433;User Id=sa;Password=Example!;TrustServerCertificate=true";

    try {
      const resolved = resolveSeedConnectionStrings();
      expect(resolved.catalogConnectionString).toContain(
        "Database=Microsoft.eShopOnWeb.CatalogDb",
      );
      expect(resolved.identityConnectionString).toContain(
        "Database=Microsoft.eShopOnWeb.Identity",
      );
      expect(resolved.serverConnectionString).toContain("localhost,1433");
    } finally {
      restore("ESHOP_CATALOG_CONNECTION", previous.catalog);
      restore("ESHOP_IDENTITY_CONNECTION", previous.identity);
      restore("ESHOP_SQLSERVER", previous.server);
      restore("CatalogConnection", previous.legacyCatalog);
      restore("IdentityConnection", previous.legacyIdentity);
    }
  });
});

function restore(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
