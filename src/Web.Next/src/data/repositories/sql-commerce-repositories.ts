import type {
  Address,
  Basket,
  BasketItem,
  CatalogItemOrdered,
  NewBasket,
  NewBasketItem,
  NewOrder,
  NewOrderItem,
  Order,
  OrderItem,
} from "@/domain/commerce/types";
import type { SqlExecutor, SqlRow } from "@/data/sql/sql-executor";
import {
  BasketColumns,
  BasketItemColumns,
  CommerceTables,
  OrderColumns,
  OrderItemColumns,
} from "@/data/sql/commerce-schema";
import type {
  BasketRepository,
  BuyerRepository,
  CheckoutUnitOfWork,
  OrderRepository,
} from "@/domain/commerce/repository-ports";
import type { Buyer, CheckoutInput } from "@/domain/commerce/types";

function requireNumber(row: SqlRow, key: string): number {
  const value = row[key];
  if (typeof value === "number") return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  throw new Error(`Expected numeric column ${key}`);
}

function requireString(row: SqlRow, key: string): string {
  const value = row[key];
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function mapBasketItem(row: SqlRow): BasketItem {
  return {
    id: requireNumber(row, BasketItemColumns.id),
    basketId: requireNumber(row, BasketItemColumns.basketId),
    catalogItemId: requireNumber(row, BasketItemColumns.catalogItemId),
    quantity: requireNumber(row, BasketItemColumns.quantity),
    unitPrice: requireNumber(row, BasketItemColumns.unitPrice),
  };
}

function mapAddress(row: SqlRow): Address {
  return {
    street: requireString(row, OrderColumns.street),
    city: requireString(row, OrderColumns.city),
    state: requireString(row, OrderColumns.state),
    country: requireString(row, OrderColumns.country),
    zipCode: requireString(row, OrderColumns.zipCode),
  };
}

function mapItemOrdered(row: SqlRow): CatalogItemOrdered {
  return {
    catalogItemId: requireNumber(row, OrderItemColumns.catalogItemId),
    productName: requireString(row, OrderItemColumns.productName),
    pictureUri: requireString(row, OrderItemColumns.pictureUri),
  };
}

function mapOrderItem(row: SqlRow): OrderItem {
  const orderIdValue = row[OrderItemColumns.orderId];
  return {
    id: requireNumber(row, OrderItemColumns.id),
    orderId:
      orderIdValue == null
        ? null
        : requireNumber(row, OrderItemColumns.orderId),
    unitPrice: requireNumber(row, OrderItemColumns.unitPrice),
    units: requireNumber(row, OrderItemColumns.units),
    itemOrdered: mapItemOrdered(row),
  };
}

function mapOrderDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number")
    return new Date(value);
  return new Date();
}

export class SqlBasketRepository implements BasketRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getById(id: number): Promise<Basket | null> {
    const basketResult = await this.db.query(
      `SELECT [${BasketColumns.id}], [${BasketColumns.buyerId}]
       FROM [dbo].[${CommerceTables.baskets}]
       WHERE [${BasketColumns.id}] = ?`,
      [id],
    );
    const basketRow = basketResult.rows[0];
    if (!basketRow) return null;

    const itemsResult = await this.db.query(
      `SELECT [${BasketItemColumns.id}], [${BasketItemColumns.basketId}],
              [${BasketItemColumns.catalogItemId}], [${BasketItemColumns.quantity}],
              [${BasketItemColumns.unitPrice}]
       FROM [dbo].[${CommerceTables.basketItems}]
       WHERE [${BasketItemColumns.basketId}] = ?`,
      [id],
    );

    return {
      id: requireNumber(basketRow, BasketColumns.id),
      buyerId: requireString(basketRow, BasketColumns.buyerId),
      items: itemsResult.rows.map(mapBasketItem),
    };
  }

  async getByBuyerId(buyerId: string): Promise<Basket | null> {
    const basketResult = await this.db.query(
      `SELECT [${BasketColumns.id}], [${BasketColumns.buyerId}]
       FROM [dbo].[${CommerceTables.baskets}]
       WHERE [${BasketColumns.buyerId}] = ?`,
      [buyerId],
    );
    const basketRow = basketResult.rows[0];
    if (!basketRow) return null;
    return this.getById(requireNumber(basketRow, BasketColumns.id));
  }

  async create(basket: NewBasket): Promise<Basket> {
    const insert = await this.db.query(
      `INSERT INTO [dbo].[${CommerceTables.baskets}] ([${BasketColumns.buyerId}])
       OUTPUT INSERTED.[${BasketColumns.id}], INSERTED.[${BasketColumns.buyerId}]
       VALUES (?)`,
      [basket.buyerId],
    );
    const created = insert.rows[0];
    if (!created) throw new Error("Failed to insert basket");
    const id = requireNumber(created, BasketColumns.id);

    for (const item of basket.items ?? []) {
      await this.insertItem(id, item);
    }

    const loaded = await this.getById(id);
    if (!loaded) throw new Error("Basket not found after create");
    return loaded;
  }

  async update(basket: Basket): Promise<Basket> {
    await this.db.query(
      `UPDATE [dbo].[${CommerceTables.baskets}]
       SET [${BasketColumns.buyerId}] = ?
       WHERE [${BasketColumns.id}] = ?`,
      [basket.buyerId, basket.id],
    );

    const existing = await this.db.query(
      `SELECT [${BasketItemColumns.id}] FROM [dbo].[${CommerceTables.basketItems}]
       WHERE [${BasketItemColumns.basketId}] = ?`,
      [basket.id],
    );
    const existingIds = new Set(
      existing.rows.map((row) => requireNumber(row, BasketItemColumns.id)),
    );
    const keepIds = new Set(
      basket.items.filter((i) => i.id > 0).map((i) => i.id),
    );

    for (const id of existingIds) {
      if (!keepIds.has(id)) {
        await this.db.query(
          `DELETE FROM [dbo].[${CommerceTables.basketItems}] WHERE [${BasketItemColumns.id}] = ?`,
          [id],
        );
      }
    }

    for (const item of basket.items) {
      if (item.id > 0 && existingIds.has(item.id)) {
        await this.db.query(
          `UPDATE [dbo].[${CommerceTables.basketItems}]
           SET [${BasketItemColumns.catalogItemId}] = ?,
               [${BasketItemColumns.quantity}] = ?,
               [${BasketItemColumns.unitPrice}] = ?
           WHERE [${BasketItemColumns.id}] = ? AND [${BasketItemColumns.basketId}] = ?`,
          [
            item.catalogItemId,
            item.quantity,
            item.unitPrice,
            item.id,
            basket.id,
          ],
        );
      } else {
        await this.insertItem(basket.id, item);
      }
    }

    const loaded = await this.getById(basket.id);
    if (!loaded) throw new Error("Basket not found after update");
    return loaded;
  }

  async delete(id: number): Promise<void> {
    // BasketItems cascade via FK_BasketItems_Baskets_BasketId
    await this.db.query(
      `DELETE FROM [dbo].[${CommerceTables.baskets}] WHERE [${BasketColumns.id}] = ?`,
      [id],
    );
  }

  private async insertItem(
    basketId: number,
    item: NewBasketItem | BasketItem,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO [dbo].[${CommerceTables.basketItems}]
        ([${BasketItemColumns.basketId}], [${BasketItemColumns.catalogItemId}],
         [${BasketItemColumns.quantity}], [${BasketItemColumns.unitPrice}])
       VALUES (?, ?, ?, ?)`,
      [basketId, item.catalogItemId, item.quantity, item.unitPrice],
    );
  }
}

export class SqlOrderRepository implements OrderRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getById(id: number): Promise<Order | null> {
    const orderResult = await this.db.query(
      `SELECT [${OrderColumns.id}], [${OrderColumns.buyerId}], [${OrderColumns.orderDate}],
              [${OrderColumns.street}], [${OrderColumns.city}], [${OrderColumns.state}],
              [${OrderColumns.country}], [${OrderColumns.zipCode}]
       FROM [dbo].[${CommerceTables.orders}]
       WHERE [${OrderColumns.id}] = ?`,
      [id],
    );
    const orderRow = orderResult.rows[0];
    if (!orderRow) return null;

    const itemsResult = await this.db.query(
      `SELECT [${OrderItemColumns.id}], [${OrderItemColumns.orderId}],
              [${OrderItemColumns.unitPrice}], [${OrderItemColumns.units}],
              [${OrderItemColumns.catalogItemId}], [${OrderItemColumns.productName}],
              [${OrderItemColumns.pictureUri}]
       FROM [dbo].[${CommerceTables.orderItems}]
       WHERE [${OrderItemColumns.orderId}] = ?`,
      [id],
    );

    return {
      id: requireNumber(orderRow, OrderColumns.id),
      buyerId: requireString(orderRow, OrderColumns.buyerId),
      orderDate: mapOrderDate(orderRow[OrderColumns.orderDate]),
      shipToAddress: mapAddress(orderRow),
      orderItems: itemsResult.rows.map(mapOrderItem),
    };
  }

  async listByBuyerId(buyerId: string): Promise<Order[]> {
    const orderResult = await this.db.query(
      `SELECT [${OrderColumns.id}]
       FROM [dbo].[${CommerceTables.orders}]
       WHERE [${OrderColumns.buyerId}] = ?
       ORDER BY [${OrderColumns.orderDate}] DESC, [${OrderColumns.id}] DESC`,
      [buyerId],
    );

    const orders: Order[] = [];
    for (const row of orderResult.rows) {
      const order = await this.getById(requireNumber(row, OrderColumns.id));
      if (order) orders.push(order);
    }
    return orders;
  }

  async create(order: NewOrder): Promise<Order> {
    const orderDate = order.orderDate ?? new Date();
    const insert = await this.db.query(
      `INSERT INTO [dbo].[${CommerceTables.orders}]
        ([${OrderColumns.buyerId}], [${OrderColumns.orderDate}],
         [${OrderColumns.street}], [${OrderColumns.city}], [${OrderColumns.state}],
         [${OrderColumns.country}], [${OrderColumns.zipCode}])
       OUTPUT INSERTED.[${OrderColumns.id}]
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        order.buyerId,
        orderDate,
        order.shipToAddress.street,
        order.shipToAddress.city,
        order.shipToAddress.state,
        order.shipToAddress.country,
        order.shipToAddress.zipCode,
      ],
    );
    const created = insert.rows[0];
    if (!created) throw new Error("Failed to insert order");
    const id = requireNumber(created, OrderColumns.id);

    for (const item of order.orderItems) {
      await this.insertItem(id, item);
    }

    const loaded = await this.getById(id);
    if (!loaded) throw new Error("Order not found after create");
    return loaded;
  }

  private async insertItem(orderId: number, item: NewOrderItem): Promise<void> {
    await this.db.query(
      `INSERT INTO [dbo].[${CommerceTables.orderItems}]
        ([${OrderItemColumns.orderId}], [${OrderItemColumns.unitPrice}], [${OrderItemColumns.units}],
         [${OrderItemColumns.catalogItemId}], [${OrderItemColumns.productName}],
         [${OrderItemColumns.pictureUri}])
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        item.unitPrice,
        item.units,
        item.itemOrdered.catalogItemId,
        item.itemOrdered.productName,
        item.itemOrdered.pictureUri,
      ],
    );
  }
}

export class SqlBuyerRepository implements BuyerRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getByIdentity(identityGuid: string): Promise<Buyer | null> {
    if (!identityGuid) return null;

    const basketHit = await this.db.query(
      `SELECT TOP 1 [${BasketColumns.buyerId}]
       FROM [dbo].[${CommerceTables.baskets}]
       WHERE [${BasketColumns.buyerId}] = ?`,
      [identityGuid],
    );
    if (basketHit.rows[0]) {
      return { identityGuid };
    }

    const orderHit = await this.db.query(
      `SELECT TOP 1 [${OrderColumns.buyerId}]
       FROM [dbo].[${CommerceTables.orders}]
       WHERE [${OrderColumns.buyerId}] = ?`,
      [identityGuid],
    );
    if (orderHit.rows[0]) {
      return { identityGuid };
    }

    return null;
  }

  async ensure(identityGuid: string): Promise<Buyer> {
    if (!identityGuid.trim()) {
      throw new Error("Buyer identity is required");
    }
    return { identityGuid };
  }
}

export class SqlCheckoutUnitOfWork implements CheckoutUnitOfWork {
  constructor(private readonly db: SqlExecutor) {}

  async createOrderAndClearBasket(input: CheckoutInput): Promise<Order> {
    return this.db.transaction(async (tx) => {
      const baskets = new SqlBasketRepository(tx);
      const orders = new SqlOrderRepository(tx);

      const basket = await baskets.getById(input.basketId);
      if (!basket) {
        throw new Error(`Basket ${input.basketId} was not found`);
      }

      const orderItems: NewOrderItem[] = input.orderItems?.length
        ? input.orderItems
        : basket.items.map((item) => ({
            unitPrice: item.unitPrice,
            units: item.quantity,
            itemOrdered: {
              catalogItemId: item.catalogItemId,
              productName: `Catalog item ${item.catalogItemId}`,
              pictureUri: "",
            },
          }));
      if (orderItems.length === 0) {
        throw new Error("Basket must contain items for checkout");
      }

      const order = await orders.create({
        buyerId: basket.buyerId,
        shipToAddress: input.shipToAddress,
        orderItems,
      });

      await baskets.delete(basket.id);
      return order;
    });
  }
}

export type CommerceRepositories = {
  baskets: BasketRepository;
  orders: OrderRepository;
  buyers: BuyerRepository;
  checkout: CheckoutUnitOfWork;
};

export function createSqlCommerceRepositories(
  db: SqlExecutor,
): CommerceRepositories {
  const baskets = new SqlBasketRepository(db);
  const orders = new SqlOrderRepository(db);
  const buyers = new SqlBuyerRepository(db);
  const checkout = new SqlCheckoutUnitOfWork(db);
  return { baskets, orders, buyers, checkout };
}
