import { describe, expect, it } from "vitest";
import {
  BasketColumns,
  BasketItemColumns,
  COMMERCE_SCHEMA_DDL,
  CommerceForeignKeys,
  CommerceTables,
  OrderColumns,
  OrderItemColumns,
} from "@/data/sql/commerce-schema";

describe("commerce SQL Server schema mapping", () => {
  it("targets the existing EF table names", () => {
    expect(CommerceTables).toEqual({
      baskets: "Baskets",
      basketItems: "BasketItems",
      orders: "Orders",
      orderItems: "OrderItems",
    });
  });

  it("maps owned address and catalog snapshot columns to EF names", () => {
    expect(OrderColumns.street).toBe("ShipToAddress_Street");
    expect(OrderColumns.zipCode).toBe("ShipToAddress_ZipCode");
    expect(OrderItemColumns.catalogItemId).toBe("ItemOrdered_CatalogItemId");
    expect(OrderItemColumns.productName).toBe("ItemOrdered_ProductName");
    expect(BasketColumns.buyerId).toBe("BuyerId");
    expect(BasketItemColumns.unitPrice).toBe("UnitPrice");
  });

  it("documents cascade for basket items and restrict for order items", () => {
    expect(CommerceForeignKeys.basketItemsCascade).toBe(
      "FK_BasketItems_Baskets_BasketId",
    );
    expect(CommerceForeignKeys.orderItemsRestrict).toBe(
      "FK_OrderItems_Orders_OrderId",
    );
    expect(COMMERCE_SCHEMA_DDL).toContain("ON DELETE CASCADE");
    expect(COMMERCE_SCHEMA_DDL).toContain("ON DELETE NO ACTION");
    expect(COMMERCE_SCHEMA_DDL).not.toContain("DROP COLUMN");
  });

  it("does not invent a Buyers table", () => {
    expect(COMMERCE_SCHEMA_DDL.toLowerCase()).not.toContain(
      "create table [dbo].[buyers]",
    );
  });
});
