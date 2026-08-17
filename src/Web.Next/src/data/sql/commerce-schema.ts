/**
 * Catalog DB table and column names matching EF Core CatalogContextModelSnapshot.
 * Do not rename — existing basket/order rows must round-trip without schema changes.
 */

export const CommerceTables = {
  baskets: "Baskets",
  basketItems: "BasketItems",
  orders: "Orders",
  orderItems: "OrderItems",
} as const;

export const BasketColumns = {
  id: "Id",
  buyerId: "BuyerId",
} as const;

export const BasketItemColumns = {
  id: "Id",
  basketId: "BasketId",
  catalogItemId: "CatalogItemId",
  quantity: "Quantity",
  unitPrice: "UnitPrice",
} as const;

export const OrderColumns = {
  id: "Id",
  buyerId: "BuyerId",
  orderDate: "OrderDate",
  street: "ShipToAddress_Street",
  city: "ShipToAddress_City",
  state: "ShipToAddress_State",
  country: "ShipToAddress_Country",
  zipCode: "ShipToAddress_ZipCode",
} as const;

export const OrderItemColumns = {
  id: "Id",
  orderId: "OrderId",
  unitPrice: "UnitPrice",
  units: "Units",
  catalogItemId: "ItemOrdered_CatalogItemId",
  productName: "ItemOrdered_ProductName",
  pictureUri: "ItemOrdered_PictureUri",
} as const;

/** Cascade: BasketItems → Baskets. Restrict: OrderItems → Orders. */
export const CommerceForeignKeys = {
  basketItemsCascade: "FK_BasketItems_Baskets_BasketId",
  orderItemsRestrict: "FK_OrderItems_Orders_OrderId",
} as const;

/**
 * DDL that recreates the commerce subset of the Catalog DB for integration tests.
 * Matches EF migrations (identity PKs, owned address/item columns, cascade/restrict).
 */
export const COMMERCE_SCHEMA_DDL = `
IF OBJECT_ID(N'[dbo].[BasketItems]', N'U') IS NOT NULL DROP TABLE [dbo].[BasketItems];
IF OBJECT_ID(N'[dbo].[Baskets]', N'U') IS NOT NULL DROP TABLE [dbo].[Baskets];
IF OBJECT_ID(N'[dbo].[OrderItems]', N'U') IS NOT NULL DROP TABLE [dbo].[OrderItems];
IF OBJECT_ID(N'[dbo].[Orders]', N'U') IS NOT NULL DROP TABLE [dbo].[Orders];

CREATE TABLE [dbo].[Baskets] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [BuyerId] NVARCHAR(256) NOT NULL
);

CREATE TABLE [dbo].[BasketItems] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UnitPrice] DECIMAL(18,2) NOT NULL,
  [Quantity] INT NOT NULL,
  [CatalogItemId] INT NOT NULL,
  [BasketId] INT NOT NULL,
  CONSTRAINT [FK_BasketItems_Baskets_BasketId]
    FOREIGN KEY ([BasketId]) REFERENCES [dbo].[Baskets]([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_BasketItems_BasketId] ON [dbo].[BasketItems]([BasketId]);

CREATE TABLE [dbo].[Orders] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [BuyerId] NVARCHAR(256) NOT NULL,
  [OrderDate] DATETIMEOFFSET NOT NULL,
  [ShipToAddress_Street] NVARCHAR(180) NOT NULL,
  [ShipToAddress_City] NVARCHAR(100) NOT NULL,
  [ShipToAddress_State] NVARCHAR(60) NOT NULL,
  [ShipToAddress_Country] NVARCHAR(90) NOT NULL,
  [ShipToAddress_ZipCode] NVARCHAR(18) NOT NULL
);

CREATE TABLE [dbo].[OrderItems] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UnitPrice] DECIMAL(18,2) NOT NULL,
  [Units] INT NOT NULL,
  [OrderId] INT NULL,
  [ItemOrdered_CatalogItemId] INT NOT NULL,
  [ItemOrdered_ProductName] NVARCHAR(50) NOT NULL,
  [ItemOrdered_PictureUri] NVARCHAR(MAX) NOT NULL,
  CONSTRAINT [FK_OrderItems_Orders_OrderId]
    FOREIGN KEY ([OrderId]) REFERENCES [dbo].[Orders]([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_OrderItems_OrderId] ON [dbo].[OrderItems]([OrderId]);
`;
