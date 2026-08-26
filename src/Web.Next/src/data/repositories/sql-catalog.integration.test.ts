import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CATALOG_SCHEMA_DDL,
  createSqlCatalogRepositories,
  getCatalogConnectionString,
  MssqlClient,
} from "@/data";
import {
  CATALOG_BRANDS,
  CATALOG_HILO_RESTART,
  CATALOG_ITEMS,
  CATALOG_TYPES,
} from "@/shared/fixtures/catalog";

const connectionString = getCatalogConnectionString();
const describeSql = connectionString ? describe : describe.skip;

describeSql("SQL Server catalog integration", () => {
  const client = new MssqlClient({ connectionString: connectionString! });

  beforeAll(async () => {
    const batches = CATALOG_SCHEMA_DDL.split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    for (const batch of batches) {
      await client.query(batch);
    }

    for (const brand of CATALOG_BRANDS) {
      await client.query(
        `INSERT INTO [dbo].[CatalogBrands] ([Id], [Brand]) VALUES (?, ?)`,
        [brand.id, brand.brand],
      );
    }
    for (const type of CATALOG_TYPES) {
      await client.query(
        `INSERT INTO [dbo].[CatalogTypes] ([Id], [Type]) VALUES (?, ?)`,
        [type.id, type.type],
      );
    }
    for (const item of CATALOG_ITEMS) {
      await client.query(
        `INSERT INTO [dbo].[Catalog]
          ([Id], [Name], [Description], [Price], [PictureUri], [CatalogTypeId], [CatalogBrandId])
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.description,
          item.price,
          item.pictureUri,
          item.catalogTypeId,
          item.catalogBrandId,
        ],
      );
    }

    await client.query(
      `ALTER SEQUENCE [dbo].[catalog_brand_hilo] RESTART WITH ${CATALOG_HILO_RESTART.catalog_brand_hilo}`,
    );
    await client.query(
      `ALTER SEQUENCE [dbo].[catalog_type_hilo] RESTART WITH ${CATALOG_HILO_RESTART.catalog_type_hilo}`,
    );
    await client.query(
      `ALTER SEQUENCE [dbo].[catalog_hilo] RESTART WITH ${CATALOG_HILO_RESTART.catalog_hilo}`,
    );
  }, 60_000);

  afterAll(async () => {
    await client.close();
  });

  it("reads seeded rows and supports filter/page/count/CRUD against SQL Server", async () => {
    const repos = createSqlCatalogRepositories(client);

    expect(await repos.items.count()).toBe(12);
    const page = await repos.items.listPaged(
      { brandId: 2 },
      { skip: 0, take: 2 },
    );
    expect(page).toHaveLength(2);
    expect(page.every((i) => i.catalogBrandId === 2)).toBe(true);

    const created = await repos.items.create({
      name: "SQL Int Hoodie",
      description: "integration",
      price: 33,
      pictureUri: "http://example/99.png",
      catalogBrandId: 2,
      catalogTypeId: 2,
    });
    expect(created.id).toBeGreaterThanOrEqual(21);

    const updated = await repos.items.update({ ...created, price: 30 });
    expect(updated.price).toBe(30);

    await repos.items.delete(created.id);
    expect(await repos.items.getById(created.id)).toBeNull();
    expect(await repos.items.count()).toBe(12);
  });
});

describe("SQL Server catalog integration gate", () => {
  it("documents how to enable live SQL Server tests", () => {
    if (!connectionString) {
      expect(connectionString).toBeUndefined();
    } else {
      expect(connectionString.length).toBeGreaterThan(0);
    }
  });
});
