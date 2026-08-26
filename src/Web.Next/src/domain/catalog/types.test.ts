import { describe, expect, it } from "vitest";
import type {
  CatalogBrand,
  CatalogItem,
  CatalogItemFilter,
  CatalogType,
} from "@/domain/catalog/types";

describe("catalog domain types", () => {
  it("models brand, type, and item without ORM fields", () => {
    const brand: CatalogBrand = { id: 2, brand: ".NET" };
    const type: CatalogType = { id: 1, type: "Mug" };
    const item: CatalogItem = {
      id: 2,
      name: ".NET Black & White Mug",
      description: ".NET Black & White Mug",
      price: 8.5,
      pictureUri: "http://catalogbaseurltobereplaced/images/products/2.png",
      catalogTypeId: type.id,
      catalogBrandId: brand.id,
    };

    expect(item.catalogBrandId).toBe(brand.id);
    expect(item.catalogTypeId).toBe(type.id);
    expect(Object.keys(item)).not.toContain("$type");
  });

  it("allows optional brand/type filters like CatalogFilterSpecification", () => {
    const filter: CatalogItemFilter = { brandId: 2, typeId: null };
    expect(filter.brandId).toBe(2);
    expect(filter.typeId).toBeNull();
  });
});
