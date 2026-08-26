/**
 * End-to-end catalog repository walkthrough for LCFM-5.
 *
 * Uses MemorySqlExecutor (SQL Server HiLo + cascade semantics) by default.
 * Set CATALOG_SQL_CONNECTION_STRING to exercise the live mssql driver instead.
 *
 * Run: npx tsx src/data/scripts/catalog-e2e.ts
 */

import {
  CATALOG_SCHEMA_DDL,
  createSqlCatalogRepositories,
  getCatalogConnectionString,
  MemorySqlExecutor,
  MssqlClient,
  type SqlExecutor,
} from "@/data";
import {
  CATALOG_BRANDS,
  CATALOG_HILO_RESTART,
  CATALOG_ITEMS,
  CATALOG_TYPES,
} from "@/shared/fixtures/catalog";

async function ensureLive(db: SqlExecutor): Promise<void> {
  const batches = CATALOG_SCHEMA_DDL.split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  for (const batch of batches) {
    await db.query(batch);
  }

  const existing = await db.query(
    `SELECT COUNT(*) AS [count] FROM [dbo].[Catalog]`,
  );
  const existingCount = Number(existing.rows[0]?.count ?? 0);
  if (existingCount > 0) {
    return;
  }

  for (const brand of CATALOG_BRANDS) {
    await db.query(
      `INSERT INTO [dbo].[CatalogBrands] ([Id], [Brand]) VALUES (?, ?)`,
      [brand.id, brand.brand],
    );
  }
  for (const type of CATALOG_TYPES) {
    await db.query(
      `INSERT INTO [dbo].[CatalogTypes] ([Id], [Type]) VALUES (?, ?)`,
      [type.id, type.type],
    );
  }
  for (const item of CATALOG_ITEMS) {
    await db.query(
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
  await db.query(
    `ALTER SEQUENCE [dbo].[catalog_brand_hilo] RESTART WITH ${CATALOG_HILO_RESTART.catalog_brand_hilo}`,
  );
  await db.query(
    `ALTER SEQUENCE [dbo].[catalog_type_hilo] RESTART WITH ${CATALOG_HILO_RESTART.catalog_type_hilo}`,
  );
  await db.query(
    `ALTER SEQUENCE [dbo].[catalog_hilo] RESTART WITH ${CATALOG_HILO_RESTART.catalog_hilo}`,
  );
}

async function withExecutor<T>(
  work: (db: SqlExecutor) => Promise<T>,
): Promise<T> {
  const connectionString = getCatalogConnectionString();
  if (!connectionString) {
    console.log(
      "Using MemorySqlExecutor (set CATALOG_SQL_CONNECTION_STRING for live SQL Server)",
    );
    return work(MemorySqlExecutor.withSeededCatalog());
  }

  console.log("Using live SQL Server via CATALOG_SQL_CONNECTION_STRING");
  const client = new MssqlClient({ connectionString });
  try {
    await ensureLive(client);
    return await work(client);
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  await withExecutor(async (db) => {
    const repos = createSqlCatalogRepositories(db);

    console.log("1) Read seeded catalog without destructive migration");
    const items = await repos.items.list();
    const brands = await repos.brands.list();
    const types = await repos.types.list();
    console.log(
      `   brands=${brands.length} types=${types.length} items=${items.length}`,
    );
    if (items.length !== 12)
      throw new Error("Expected 12 seeded catalog items");

    console.log("2) Filter + page + count");
    const netMugs = await repos.items.list({ brandId: 2, typeId: 1 });
    const page = await repos.items.listPaged({}, { skip: 0, take: 4 });
    const count = await repos.items.count({ brandId: 2 });
    console.log(
      `   netMugs=${netMugs.length} page=${page.length} netBrandCount=${count}`,
    );
    if (netMugs.length !== 1) throw new Error("Expected one .NET Mug");
    if (page.length !== 4) throw new Error("Expected page size 4");

    console.log("3) CRUD round-trip");
    const created = await repos.items.create({
      name: "E2E Hoodie",
      description: "e2e",
      price: 40,
      pictureUri: "http://catalogbaseurltobereplaced/images/products/e2e.png",
      catalogBrandId: 2,
      catalogTypeId: 2,
    });
    console.log(`   created #${created.id}`);
    const updated = await repos.items.update({ ...created, price: 35 });
    if (updated.price !== 35) throw new Error("Update failed");
    await repos.items.delete(created.id);
    if ((await repos.items.getById(created.id)) !== null) {
      throw new Error("Delete failed");
    }

    console.log("OK catalog e2e walkthrough passed");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
