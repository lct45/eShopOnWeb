import type {
  SqlExecutor,
  SqlParameter,
  SqlQueryResult,
  SqlRow,
} from "@/data/sql/sql-executor";

type BasketRow = { Id: number; BuyerId: string };
type BasketItemRow = {
  Id: number;
  BasketId: number;
  CatalogItemId: number;
  Quantity: number;
  UnitPrice: number;
};
type OrderRow = {
  Id: number;
  BuyerId: string;
  OrderDate: Date;
  ShipToAddress_Street: string;
  ShipToAddress_City: string;
  ShipToAddress_State: string;
  ShipToAddress_Country: string;
  ShipToAddress_ZipCode: string;
};
type OrderItemRow = {
  Id: number;
  OrderId: number | null;
  UnitPrice: number;
  Units: number;
  ItemOrdered_CatalogItemId: number;
  ItemOrdered_ProductName: string;
  ItemOrdered_PictureUri: string;
};

type DbState = {
  baskets: BasketRow[];
  basketItems: BasketItemRow[];
  orders: OrderRow[];
  orderItems: OrderItemRow[];
  nextBasketId: number;
  nextBasketItemId: number;
  nextOrderId: number;
  nextOrderItemId: number;
};

function cloneState(state: DbState): DbState {
  return {
    baskets: state.baskets.map((r) => ({ ...r })),
    basketItems: state.basketItems.map((r) => ({ ...r })),
    orders: state.orders.map((r) => ({ ...r })),
    orderItems: state.orderItems.map((r) => ({ ...r })),
    nextBasketId: state.nextBasketId,
    nextBasketItemId: state.nextBasketItemId,
    nextOrderId: state.nextOrderId,
    nextOrderItemId: state.nextOrderItemId,
  };
}

function emptyState(): DbState {
  return {
    baskets: [],
    basketItems: [],
    orders: [],
    orderItems: [],
    nextBasketId: 1,
    nextBasketItemId: 1,
    nextOrderId: 1,
    nextOrderItemId: 1,
  };
}

function normalizeSql(sqlText: string): string {
  return sqlText.replace(/\s+/g, " ").trim();
}

/**
 * In-memory executor that understands the commerce SQL issued by Sql*Repository.
 * Enforces BasketItems CASCADE and OrderItems RESTRICT (NO ACTION) like SQL Server.
 */
export class MemorySqlExecutor implements SqlExecutor {
  private state: DbState;
  private readonly transactionStack: DbState[] = [];

  constructor(seed?: DbState) {
    this.state = seed ? cloneState(seed) : emptyState();
  }

  snapshot(): DbState {
    return cloneState(this.state);
  }

  async query(
    sqlText: string,
    params: SqlParameter[] = [],
  ): Promise<SqlQueryResult> {
    const sql = normalizeSql(sqlText);

    if (/^INSERT INTO \[dbo\]\.\[Baskets\]/i.test(sql)) {
      const buyerId = String(params[0]);
      const row: BasketRow = {
        Id: this.state.nextBasketId++,
        BuyerId: buyerId,
      };
      this.state.baskets.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ ...row }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[BasketItems\]/i.test(sql)) {
      const row: BasketItemRow = {
        Id: this.state.nextBasketItemId++,
        BasketId: Number(params[0]),
        CatalogItemId: Number(params[1]),
        Quantity: Number(params[2]),
        UnitPrice: Number(params[3]),
      };
      if (!this.state.baskets.some((b) => b.Id === row.BasketId)) {
        throw new Error("FK violation: BasketItems.BasketId");
      }
      this.state.basketItems.push(row);
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[Orders\]/i.test(sql)) {
      const row: OrderRow = {
        Id: this.state.nextOrderId++,
        BuyerId: String(params[0]),
        OrderDate:
          params[1] instanceof Date ? params[1] : new Date(String(params[1])),
        ShipToAddress_Street: String(params[2]),
        ShipToAddress_City: String(params[3]),
        ShipToAddress_State: String(params[4]),
        ShipToAddress_Country: String(params[5]),
        ShipToAddress_ZipCode: String(params[6]),
      };
      this.state.orders.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ Id: row.Id }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[OrderItems\]/i.test(sql)) {
      const orderId = params[0] == null ? null : Number(params[0]);
      if (orderId != null && !this.state.orders.some((o) => o.Id === orderId)) {
        throw new Error("FK violation: OrderItems.OrderId");
      }
      const row: OrderItemRow = {
        Id: this.state.nextOrderItemId++,
        OrderId: orderId,
        UnitPrice: Number(params[1]),
        Units: Number(params[2]),
        ItemOrdered_CatalogItemId: Number(params[3]),
        ItemOrdered_ProductName: String(params[4]),
        ItemOrdered_PictureUri: String(params[5]),
      };
      this.state.orderItems.push(row);
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[Baskets\]/i.test(sql)) {
      const buyerId = String(params[0]);
      const id = Number(params[1]);
      const basket = this.state.baskets.find((b) => b.Id === id);
      if (!basket) return { rows: [], rowsAffected: 0 };
      basket.BuyerId = buyerId;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[BasketItems\]/i.test(sql)) {
      const catalogItemId = Number(params[0]);
      const quantity = Number(params[1]);
      const unitPrice = Number(params[2]);
      const id = Number(params[3]);
      const basketId = Number(params[4]);
      const item = this.state.basketItems.find(
        (i) => i.Id === id && i.BasketId === basketId,
      );
      if (!item) return { rows: [], rowsAffected: 0 };
      item.CatalogItemId = catalogItemId;
      item.Quantity = quantity;
      item.UnitPrice = unitPrice;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^DELETE FROM \[dbo\]\.\[Baskets\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.baskets.length;
      this.state.baskets = this.state.baskets.filter((b) => b.Id !== id);
      // CASCADE
      this.state.basketItems = this.state.basketItems.filter(
        (i) => i.BasketId !== id,
      );
      return {
        rows: [],
        rowsAffected: before === this.state.baskets.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[BasketItems\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.basketItems.length;
      this.state.basketItems = this.state.basketItems.filter(
        (i) => i.Id !== id,
      );
      return {
        rows: [],
        rowsAffected: before === this.state.basketItems.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[Orders\]/i.test(sql)) {
      const id = Number(params[0]);
      const dependents = this.state.orderItems.filter((i) => i.OrderId === id);
      if (dependents.length > 0) {
        // ON DELETE NO ACTION / Restrict
        throw new Error(
          "The DELETE statement conflicted with the REFERENCE constraint FK_OrderItems_Orders_OrderId",
        );
      }
      const before = this.state.orders.length;
      this.state.orders = this.state.orders.filter((o) => o.Id !== id);
      return {
        rows: [],
        rowsAffected: before === this.state.orders.length ? 0 : 1,
      };
    }

    if (/FROM \[dbo\]\.\[Baskets\].*WHERE \[Id\] = \?/i.test(sql)) {
      const id = Number(params[0]);
      const rows = this.state.baskets
        .filter((b) => b.Id === id)
        .map((b) => ({ ...b }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (/FROM \[dbo\]\.\[Baskets\].*WHERE \[BuyerId\] = \?/i.test(sql)) {
      const buyerId = String(params[0]);
      let rows = this.state.baskets
        .filter((b) => b.BuyerId === buyerId)
        .map((b) => ({ ...b }) as SqlRow);
      if (/SELECT TOP 1/i.test(sql)) rows = rows.slice(0, 1);
      return { rows, rowsAffected: rows.length };
    }

    if (/FROM \[dbo\]\.\[BasketItems\].*WHERE \[BasketId\] = \?/i.test(sql)) {
      const basketId = Number(params[0]);
      const rows = this.state.basketItems
        .filter((i) => i.BasketId === basketId)
        .map((i) => ({ ...i }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[BasketItems\].*SELECT \[Id\]/i.test(sql) &&
      /WHERE \[BasketId\] = \?/i.test(sql)
    ) {
      const basketId = Number(params[0]);
      const rows = this.state.basketItems
        .filter((i) => i.BasketId === basketId)
        .map((i) => ({ Id: i.Id }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (/FROM \[dbo\]\.\[Orders\].*WHERE \[Id\] = \?/i.test(sql)) {
      const id = Number(params[0]);
      const rows = this.state.orders
        .filter((o) => o.Id === id)
        .map((o) => ({ ...o }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (/FROM \[dbo\]\.\[Orders\].*WHERE \[BuyerId\] = \?/i.test(sql)) {
      const buyerId = String(params[0]);
      let rows = this.state.orders
        .filter((o) => o.BuyerId === buyerId)
        .sort(
          (a, b) =>
            b.OrderDate.getTime() - a.OrderDate.getTime() || b.Id - a.Id,
        )
        .map((o) => ({ ...o }) as SqlRow);
      if (/SELECT TOP 1/i.test(sql)) {
        rows = rows.slice(0, 1).map((o) => ({ BuyerId: o.BuyerId }));
      } else if (/SELECT \[Id\]/i.test(sql)) {
        rows = rows.map((o) => ({ Id: o.Id }));
      }
      return { rows, rowsAffected: rows.length };
    }

    if (/FROM \[dbo\]\.\[OrderItems\].*WHERE \[OrderId\] = \?/i.test(sql)) {
      const orderId = Number(params[0]);
      const rows = this.state.orderItems
        .filter((i) => i.OrderId === orderId)
        .map((i) => ({ ...i }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    throw new Error(`MemorySqlExecutor does not support SQL: ${sql}`);
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    this.transactionStack.push(cloneState(this.state));
    try {
      const result = await work(this);
      this.transactionStack.pop();
      return result;
    } catch (error) {
      const previous = this.transactionStack.pop();
      if (previous) {
        this.state = previous;
      }
      throw error;
    }
  }
}
