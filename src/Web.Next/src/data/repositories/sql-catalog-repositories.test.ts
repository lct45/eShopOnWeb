import { beforeEach, describe, expect, it } from "vitest";
import {
  createSqlCatalogRepositories,
  MemorySqlExecutor,
  type CatalogRepositories,
} from "@/data";
import { CATALOG_ITEMS } from "@/shared/fixtures/catalog";

describe("SQL catalog repositories (memory SQL Server semantics)", () => {
  let db: MemorySqlExecutor;
  let repos: CatalogRepositories;

  beforeEach(() => {
    db = MemorySqlExecutor.withSeededCatalog();
    repos = createSqlCatalogRepositories(db);
  });

  it("reads seeded catalog data without a destructive migration", async () => {
    const brands = await repos.brands.list();
    const types = await repos.types.list();
    const items = await repos.items.list();

    expect(brands.map((b) => b.brand)).toContain(".NET");
    expect(types.map((t) => t.type)).toContain("Mug");
    expect(items).toHaveLength(CATALOG_ITEMS.length);

    const mug = await repos.items.getById(2);
    expect(mug?.name).toBe(".NET Black & White Mug");
    expect(mug?.price).toBe(8.5);
  });

  it("filters, pages, and counts items like CatalogFilter*Specification", async () => {
    const netBrand = await repos.items.list({ brandId: 2 });
    expect(netBrand.every((i) => i.catalogBrandId === 2)).toBe(true);
    expect(netBrand.length).toBeGreaterThan(0);

    const mugAndNet = await repos.items.list({ brandId: 2, typeId: 1 });
    expect(mugAndNet).toHaveLength(1);
    expect(mugAndNet[0]?.name).toContain("Mug");

    const total = await repos.items.count();
    expect(total).toBe(12);

    const page = await repos.items.listPaged({}, { skip: 0, take: 10 });
    expect(page).toHaveLength(10);
    expect(page.map((i) => i.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(page.map((i) => i.name)).toContain("Roslyn Red Sheet");
    expect(page.map((i) => i.name)).not.toContain("Prism White TShirt");

    const page2 = await repos.items.listPaged({}, { skip: 10, take: 10 });
    expect(page2).toHaveLength(2);
    expect(page2.map((i) => i.id)).toEqual([11, 12]);
    expect(page2.map((i) => i.name)).toContain("Prism White TShirt");

    const allMatches = await repos.items.listPaged({}, { skip: 0, take: 0 });
    expect(allMatches).toHaveLength(12);
    expect(allMatches.map((i) => i.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);

    const remaining = await repos.items.listPaged({}, { skip: 10, take: 0 });
    expect(remaining).toHaveLength(2);
    expect(remaining.map((i) => i.id)).toEqual([11, 12]);

    const filteredCount = await repos.items.count({ brandId: 5 });
    expect(filteredCount).toBe(
      CATALOG_ITEMS.filter((i) => i.catalogBrandId === 5).length,
    );
  });

  it("creates, updates, and deletes catalog brands, types, and items", async () => {
    const brand = await repos.brands.create({ brand: "Contoso" });
    expect(brand.id).toBeGreaterThan(0);
    const type = await repos.types.create({ type: "Hoodie" });
    expect(type.id).toBeGreaterThan(0);

    const created = await repos.items.create({
      name: "Contoso Hoodie",
      description: "Demo hoodie",
      price: 29.99,
      pictureUri: "http://catalogbaseurltobereplaced/images/products/99.png",
      catalogBrandId: brand.id,
      catalogTypeId: type.id,
    });
    expect(created.id).toBeGreaterThanOrEqual(21);

    const secondItem = await repos.items.create({
      name: "Contoso Hoodie 2",
      description: "Demo hoodie 2",
      price: 19.99,
      pictureUri: "http://catalogbaseurltobereplaced/images/products/98.png",
      catalogBrandId: brand.id,
      catalogTypeId: type.id,
    });
    expect(secondItem.id).toBe(created.id + 1);
    await repos.items.delete(secondItem.id);

    const updated = await repos.items.update({
      ...created,
      price: 24.5,
      name: "Contoso Hoodie Sale",
    });
    expect(updated.price).toBe(24.5);
    expect(updated.name).toBe("Contoso Hoodie Sale");

    await repos.items.delete(updated.id);
    expect(await repos.items.getById(updated.id)).toBeNull();

    const renamedBrand = await repos.brands.update({
      id: brand.id,
      brand: "Contoso Labs",
    });
    expect(renamedBrand.brand).toBe("Contoso Labs");

    await repos.brands.delete(brand.id);
    expect(await repos.brands.getById(brand.id)).toBeNull();
  });

  it("assigns consecutive catalog ids from the EF HiLo block", async () => {
    const ids: number[] = [];
    for (let n = 0; n < 11; n++) {
      const item = await repos.items.create({
        name: `Hilo ${n}`,
        description: "hilo",
        price: 1,
        pictureUri:
          "http://catalogbaseurltobereplaced/images/products/hilo.png",
        catalogBrandId: 2,
        catalogTypeId: 2,
      });
      ids.push(item.id);
    }
    expect(ids).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
  });

  it("cascades catalog item deletes when a brand is deleted", async () => {
    const before = await repos.items.count({ brandId: 5 });
    expect(before).toBeGreaterThan(0);

    await repos.brands.delete(5);

    expect(await repos.items.count({ brandId: 5 })).toBe(0);
    expect(await repos.brands.getById(5)).toBeNull();
  });

  it("exposes repository ports without ORM record types", async () => {
    const item = await repos.items.getById(1);
    expect(item).toBeTruthy();
    expect(Object.keys(item!)).toEqual([
      "id",
      "name",
      "description",
      "price",
      "pictureUri",
      "catalogTypeId",
      "catalogBrandId",
    ]);
  });
});
