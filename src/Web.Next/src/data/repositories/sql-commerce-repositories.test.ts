import { beforeEach, describe, expect, it } from "vitest";
import {
  createSqlCommerceRepositories,
  MemorySqlExecutor,
  type CommerceRepositories,
} from "@/data";
import type { Address } from "@/domain/commerce";

const address: Address = {
  street: "123 Main",
  city: "Redmond",
  state: "WA",
  country: "USA",
  zipCode: "98052",
};

describe("SQL commerce repositories (memory SQL Server semantics)", () => {
  let db: MemorySqlExecutor;
  let repos: CommerceRepositories;

  beforeEach(() => {
    db = new MemorySqlExecutor();
    repos = createSqlCommerceRepositories(db);
  });

  it("round-trips a basket with items", async () => {
    const created = await repos.baskets.create({
      buyerId: "anon-1",
      items: [{ catalogItemId: 2, quantity: 3, unitPrice: 8.5 }],
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.items).toHaveLength(1);
    expect(created.items[0]?.catalogItemId).toBe(2);

    const byBuyer = await repos.baskets.getByBuyerId("anon-1");
    expect(byBuyer?.id).toBe(created.id);
    expect(byBuyer?.items[0]?.quantity).toBe(3);

    const updated = await repos.baskets.update({
      ...created,
      items: [
        {
          id: created.items[0]!.id,
          basketId: created.id,
          catalogItemId: 2,
          quantity: 5,
          unitPrice: 8.5,
        },
      ],
    });
    expect(updated.items[0]?.quantity).toBe(5);
  });

  it("cascades basket item deletes when the basket is deleted", async () => {
    const basket = await repos.baskets.create({
      buyerId: "buyer-cascade",
      items: [
        { catalogItemId: 1, quantity: 1, unitPrice: 10 },
        { catalogItemId: 2, quantity: 2, unitPrice: 20 },
      ],
    });

    await repos.baskets.delete(basket.id);

    expect(await repos.baskets.getById(basket.id)).toBeNull();
    const orphanCheck = await db.query(
      `SELECT [Id] FROM [dbo].[BasketItems] WHERE [BasketId] = ?`,
      [basket.id],
    );
    expect(orphanCheck.rows).toHaveLength(0);
  });

  it("creates, lists, and details orders with owned address and item snapshots", async () => {
    const order = await repos.orders.create({
      buyerId: "demouser@microsoft.com",
      shipToAddress: address,
      orderItems: [
        {
          unitPrice: 5.5,
          units: 2,
          itemOrdered: {
            catalogItemId: 1,
            productName: ".NET Bot Black Sweatshirt",
            pictureUri:
              "http://catalogbaseurltobereplaced/images/products/1.png",
          },
        },
        {
          unitPrice: 7.5,
          units: 5,
          itemOrdered: {
            catalogItemId: 2,
            productName: ".NET Black & White Mug",
            pictureUri:
              "http://catalogbaseurltobereplaced/images/products/2.png",
          },
        },
      ],
    });

    expect(order.shipToAddress.city).toBe("Redmond");
    expect(order.orderItems).toHaveLength(2);

    const listed = await repos.orders.listByBuyerId("demouser@microsoft.com");
    expect(listed.map((o) => o.id)).toContain(order.id);

    const detail = await repos.orders.getById(order.id);
    expect(detail?.orderItems.find((i) => i.unitPrice === 5.5)?.units).toBe(2);
    expect(
      detail?.orderItems.find((i) => i.unitPrice === 7.5)?.itemOrdered
        .productName,
    ).toContain("Mug");
  });

  it("resolves buyers from Basket/Order BuyerId without a Buyers table", async () => {
    expect(await repos.buyers.getByIdentity("missing")).toBeNull();
    await repos.baskets.create({ buyerId: "shopper-a" });
    expect(await repos.buyers.getByIdentity("shopper-a")).toEqual({
      identityGuid: "shopper-a",
    });
    expect(await repos.buyers.ensure("new-shopper")).toEqual({
      identityGuid: "new-shopper",
    });
  });

  it("falls back to basket lines when checkout orderItems is an empty array", async () => {
    const basket = await repos.baskets.create({
      buyerId: "empty-override-user",
      items: [{ catalogItemId: 2, quantity: 3, unitPrice: 8.5 }],
    });

    const order = await repos.checkout.createOrderAndClearBasket({
      basketId: basket.id,
      shipToAddress: address,
      orderItems: [],
    });

    expect(order.orderItems).toHaveLength(1);
    expect(order.orderItems[0]?.units).toBe(3);
    expect(order.orderItems[0]?.itemOrdered.catalogItemId).toBe(2);
    expect(await repos.baskets.getById(basket.id)).toBeNull();
  });

  it("checks out inside a transaction: order persisted and basket cleared", async () => {
    const basket = await repos.baskets.create({
      buyerId: "checkout-user",
      items: [{ catalogItemId: 2, quantity: 49, unitPrice: 8.5 }],
    });

    const order = await repos.checkout.createOrderAndClearBasket({
      basketId: basket.id,
      shipToAddress: address,
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

    expect(order.buyerId).toBe("checkout-user");
    expect(order.orderItems[0]?.units).toBe(49);
    expect(await repos.baskets.getById(basket.id)).toBeNull();
    expect(await repos.orders.getById(order.id)).not.toBeNull();
  });

  it("rolls back checkout when order creation fails after basket load", async () => {
    const basket = await repos.baskets.create({
      buyerId: "rollback-user",
      items: [{ catalogItemId: 1, quantity: 1, unitPrice: 12 }],
    });

    const originalQuery = db.query.bind(db);
    db.query = async (sqlText, params) => {
      if (/INSERT INTO \[dbo\]\.\[Orders\]/i.test(sqlText)) {
        throw new Error("simulated order insert failure");
      }
      return originalQuery(sqlText, params);
    };

    await expect(
      repos.checkout.createOrderAndClearBasket({
        basketId: basket.id,
        shipToAddress: address,
      }),
    ).rejects.toThrow(/simulated order insert failure/);

    db.query = originalQuery;
    expect(await repos.baskets.getById(basket.id)).not.toBeNull();
    expect(await repos.orders.listByBuyerId("rollback-user")).toHaveLength(0);
  });

  it("rejects deleting an order that still has order items (RESTRICT)", async () => {
    const order = await repos.orders.create({
      buyerId: "restrict-user",
      shipToAddress: address,
      orderItems: [
        {
          unitPrice: 1,
          units: 1,
          itemOrdered: {
            catalogItemId: 1,
            productName: "Item",
            pictureUri: "x",
          },
        },
      ],
    });

    await expect(
      db.query(`DELETE FROM [dbo].[Orders] WHERE [Id] = ?`, [order.id]),
    ).rejects.toThrow(/FK_OrderItems_Orders_OrderId/);
  });
});
