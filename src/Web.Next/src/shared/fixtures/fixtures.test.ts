import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATALOG_BRANDS,
  CATALOG_ITEMS,
  CATALOG_TYPES,
  DEMO_PASSWORD,
  ROLES,
  SEED_ROLES,
  SEED_USERS,
} from "./index";

describe("shared fixtures parity with .NET EF seeders", () => {
  it("seeds exactly 12 catalog items including Playwright product names", () => {
    expect(CATALOG_ITEMS).toHaveLength(12);
    expect(CATALOG_ITEMS[0]?.name).toBe(".NET Bot Black Sweatshirt");
    expect(CATALOG_ITEMS[0]?.price).toBe(19.5);
    expect(CATALOG_ITEMS[1]?.name).toBe(".NET Black & White Mug");
    expect(CATALOG_ITEMS.map((i) => i.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("keeps brand and type names/ids aligned with CatalogContextSeed", () => {
    expect(CATALOG_BRANDS.map((b) => b.brand)).toEqual([
      "Azure",
      ".NET",
      "Visual Studio",
      "SQL Server",
      "Other",
    ]);
    expect(CATALOG_TYPES.map((t) => t.type)).toEqual([
      "Mug",
      "T-Shirt",
      "Sheet",
      "USB Memory Stick",
    ]);
  });

  it("keeps demo users, roles, and password identical to current tests", () => {
    expect(DEMO_PASSWORD).toBe("Pass@word1");
    expect(SEED_USERS.map((u) => u.userName)).toEqual([
      "demouser@microsoft.com",
      "productmgr@microsoft.com",
      "admin@microsoft.com",
    ]);
    expect(SEED_ROLES.map((r) => r.name)).toEqual([
      ROLES.ADMINISTRATORS,
      ROLES.PRODUCT_MANAGERS,
    ]);
    expect(
      SEED_USERS.find((u) => u.userName.startsWith("admin"))?.roles,
    ).toEqual([ROLES.ADMINISTRATORS]);
    expect(
      SEED_USERS.find((u) => u.userName.startsWith("product"))?.roles,
    ).toEqual([ROLES.PRODUCT_MANAGERS]);
    expect(
      SEED_USERS.find((u) => u.userName.startsWith("demo"))?.roles,
    ).toEqual([]);
  });

  it("matches CatalogContextSeed.cs constructor argument order (type, brand, desc, name, price)", () => {
    const seedPath = resolve(
      __dirname,
      "../../../../Infrastructure/Data/CatalogContextSeed.cs",
    );
    const source = readFileSync(seedPath, "utf8");
    expect(source).toContain(
      'new(2,2, ".NET Bot Black Sweatshirt", ".NET Bot Black Sweatshirt", 19.5M',
    );
    expect(CATALOG_ITEMS[0]).toMatchObject({
      catalogTypeId: 2,
      catalogBrandId: 2,
      name: ".NET Bot Black Sweatshirt",
      price: 19.5,
    });
  });
});
