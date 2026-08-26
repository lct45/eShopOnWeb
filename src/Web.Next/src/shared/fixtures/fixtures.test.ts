import { describe, expect, it } from "vitest";
import {
  CATALOG_BRANDS,
  CATALOG_HILO_RESTART,
  CATALOG_ITEMS,
  CATALOG_TYPES,
} from "@/shared/fixtures/catalog";

describe("catalog fixtures", () => {
  it("matches the .NET CatalogContextSeed demo catalog", () => {
    expect(CATALOG_BRANDS).toHaveLength(5);
    expect(CATALOG_TYPES).toHaveLength(4);
    expect(CATALOG_ITEMS).toHaveLength(12);
    expect(CATALOG_ITEMS[1]?.name).toBe(".NET Black & White Mug");
    expect(CATALOG_HILO_RESTART.catalog_hilo).toBe(21);
  });
});
