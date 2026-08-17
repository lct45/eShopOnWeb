/**
 * End-to-end commerce repository walkthrough for LCFM-7.
 *
 * Uses MemorySqlExecutor (SQL Server cascade/restrict semantics) by default.
 * Set CATALOG_SQL_CONNECTION_STRING to exercise the live mssql driver instead.
 *
 * Run: npx tsx src/data/scripts/commerce-e2e.ts
 */

import {
  COMMERCE_SCHEMA_DDL,
  createSqlCommerceRepositories,
  getCatalogConnectionString,
  MemorySqlExecutor,
  MssqlClient,
  type SqlExecutor,
} from "@/data";

async function withExecutor<T>(
  work: (db: SqlExecutor) => Promise<T>,
): Promise<T> {
  const connectionString = getCatalogConnectionString();
  if (!connectionString) {
    console.log(
      "Using MemorySqlExecutor (set CATALOG_SQL_CONNECTION_STRING for live SQL Server)",
    );
    return work(new MemorySqlExecutor());
  }

  console.log("Using live SQL Server via CATALOG_SQL_CONNECTION_STRING");
  const client = new MssqlClient({ connectionString });
  try {
    const batches = COMMERCE_SCHEMA_DDL.split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    for (const batch of batches) {
      await client.query(batch);
    }
    return await work(client);
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  await withExecutor(async (db) => {
    const repos = createSqlCommerceRepositories(db);
    const buyerId = `e2e-${Date.now()}`;

    console.log("1) Create basket with items");
    const basket = await repos.baskets.create({
      buyerId,
      items: [{ catalogItemId: 2, quantity: 49, unitPrice: 8.5 }],
    });
    console.log(`   basket #${basket.id} total=$${(49 * 8.5).toFixed(2)}`);

    console.log("2) Checkout transaction (create order + clear basket)");
    const order = await repos.checkout.createOrderAndClearBasket({
      basketId: basket.id,
      shipToAddress: {
        street: "123 Main",
        city: "Redmond",
        state: "WA",
        country: "USA",
        zipCode: "98052",
      },
      orderItems: [
        {
          unitPrice: 8.5,
          units: 49,
          itemOrdered: {
            catalogItemId: 2,
            productName: ".NET Black & White Mug",
            pictureUri:
              "http://catalogbaseurltobereplaced/images/products/2.png",
          },
        },
      ],
    });
    console.log(`   order #${order.id} items=${order.orderItems.length}`);

    console.log("3) Verify basket cleared and order detail loads");
    const cleared = await repos.baskets.getById(basket.id);
    const detail = await repos.orders.getById(order.id);
    const buyer = await repos.buyers.getByIdentity(buyerId);
    console.log(`   basket=${cleared}`);
    console.log(`   orderItems=${detail?.orderItems.length}`);
    console.log(`   buyer=${buyer?.identityGuid}`);

    if (cleared !== null)
      throw new Error("Basket should be deleted after checkout");
    if (!detail || detail.orderItems.length !== 1)
      throw new Error("Order detail mismatch");
    if (!buyer)
      throw new Error("Buyer identity should resolve from Orders.BuyerId");

    console.log("OK commerce e2e walkthrough passed");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
