import { describe, expect, it } from "vitest";
import {
  CATALOG_HILO_INCREMENT,
  CATALOG_SCHEMA_DDL,
  CatalogForeignKeys,
  CatalogItemColumns,
  CatalogSequences,
  CatalogTables,
} from "@/data/sql/catalog-schema";

describe("catalog SQL Server schema mapping", () => {
  it("targets the existing EF table names", () => {
    expect(CatalogTables).toEqual({
      brands: "CatalogBrands",
      types: "CatalogTypes",
      items: "Catalog",
    });
  });

  it("maps item columns and HiLo sequences to EF names", () => {
    expect(CatalogItemColumns.catalogBrandId).toBe("CatalogBrandId");
    expect(CatalogItemColumns.pictureUri).toBe("PictureUri");
    expect(CatalogSequences.item).toBe("catalog_hilo");
    expect(CatalogSequences.brand).toBe("catalog_brand_hilo");
    expect(CatalogSequences.type).toBe("catalog_type_hilo");
    expect(CATALOG_HILO_INCREMENT).toBe(10);
  });

  it("documents cascade FKs and avoids PostgreSQL-specific DDL", () => {
    expect(CatalogForeignKeys.itemBrand).toBe(
      "FK_Catalog_CatalogBrands_CatalogBrandId",
    );
    expect(CATALOG_SCHEMA_DDL).toContain("ON DELETE CASCADE");
    expect(CATALOG_SCHEMA_DDL).toContain("CREATE SEQUENCE");
    expect(CATALOG_SCHEMA_DDL.toLowerCase()).not.toContain("serial");
    expect(CATALOG_SCHEMA_DDL.toLowerCase()).not.toContain("postgres");
    expect(CATALOG_SCHEMA_DDL).not.toContain("DROP COLUMN");
    expect(CATALOG_SCHEMA_DDL.toUpperCase()).not.toContain("DROP TABLE");
    expect(CATALOG_SCHEMA_DDL.toUpperCase()).not.toContain("DROP SEQUENCE");
  });
});
