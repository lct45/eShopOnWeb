import { describe, expect, it } from "vitest";
import type { Basket, Order } from "@/domain/commerce";

describe("commerce domain types", () => {
  it("keeps basket totals compatible with known .NET fixture math", () => {
    const basket: Basket = {
      id: 1,
      buyerId: "test",
      items: [
        { id: 1, basketId: 1, catalogItemId: 2, quantity: 49, unitPrice: 8.5 },
      ],
    };
    const total = basket.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    expect(total).toBe(416.5);
  });

  it("computes order totals from unit price × units", () => {
    const order: Order = {
      id: 1,
      buyerId: "test",
      orderDate: new Date("2020-01-01T00:00:00Z"),
      shipToAddress: {
        street: "s",
        city: "c",
        state: "st",
        country: "co",
        zipCode: "z",
      },
      orderItems: [
        {
          id: 1,
          orderId: 1,
          unitPrice: 5.5,
          units: 2,
          itemOrdered: { catalogItemId: 1, productName: "a", pictureUri: "p" },
        },
        {
          id: 2,
          orderId: 1,
          unitPrice: 7.5,
          units: 5,
          itemOrdered: { catalogItemId: 2, productName: "b", pictureUri: "p" },
        },
      ],
    };
    const total = order.orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.units,
      0,
    );
    expect(total).toBe(48.5);
  });
});
