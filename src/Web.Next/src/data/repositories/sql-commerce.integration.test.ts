import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  COMMERCE_SCHEMA_DDL,
  createSqlCommerceRepositories,
  getCatalogConnectionString,
  MssqlClient,
} from "@/data";
import type { Address } from "@/domain/commerce";

const connectionString = getCatalogConnectionString();
const describeSql = connectionString ? describe : describe.skip;

const address: Address = {
  street: "1 Microsoft Way",
  city: "Redmond",
  state: "WA",
  country: "USA",
  zipCode: "98052",
};

describeSql("SQL Server commerce integration", () => {
  const client = new MssqlClient({ connectionString: connectionString! });

  beforeAll(async () => {
    const batches = COMMERCE_SCHEMA_DDL.split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    for (const batch of batches) {
      await client.query(batch);
    }
  }, 60_000);

  afterAll(async () => {
    await client.close();
  });

  it("round-trips basket and order aggregates against SQL Server", async () => {
    const repos = createSqlCommerceRepositories(client);
    const buyerId = `sql-int-${Date.now()}`;

    const basket = await repos.baskets.create({
      buyerId,
      items: [{ catalogItemId: 2, quantity: 2, unitPrice: 8.5 }],
    });

    const order = await repos.checkout.createOrderAndClearBasket({
      basketId: basket.id,
      shipToAddress: address,
      orderItems: [
        {
          unitPrice: 8.5,
          units: 2,
          itemOrdered: {
            catalogItemId: 2,
            productName: ".NET Black & White Mug",
            pictureUri:
              "http://catalogbaseurltobereplaced/images/products/2.png",
          },
        },
      ],
    });

    expect(await repos.baskets.getById(basket.id)).toBeNull();
    const loaded = await repos.orders.getById(order.id);
    expect(loaded?.orderItems).toHaveLength(1);
    expect(loaded?.shipToAddress.street).toBe(address.street);
    expect(await repos.buyers.getByIdentity(buyerId)).toEqual({
      identityGuid: buyerId,
    });
  });
});

describe("SQL Server integration gate", () => {
  it("documents how to enable live SQL Server tests", () => {
    if (!connectionString) {
      expect(connectionString).toBeUndefined();
    } else {
      expect(connectionString.length).toBeGreaterThan(0);
    }
  });
});
