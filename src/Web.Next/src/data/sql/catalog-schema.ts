/**
 * Catalog DB table and column names matching EF Core CatalogContextModelSnapshot.
 * Do not rename — existing seeded catalog rows must round-trip without schema changes.
 */

export const CatalogTables = {
  brands: "CatalogBrands",
  types: "CatalogTypes",
  items: "Catalog",
} as const;

export const CatalogBrandColumns = {
  id: "Id",
  brand: "Brand",
} as const;

export const CatalogTypeColumns = {
  id: "Id",
  type: "Type",
} as const;

export const CatalogItemColumns = {
  id: "Id",
  name: "Name",
  description: "Description",
  price: "Price",
  pictureUri: "PictureUri",
  catalogTypeId: "CatalogTypeId",
  catalogBrandId: "CatalogBrandId",
} as const;

export const CatalogSequences = {
  brand: "catalog_brand_hilo",
  type: "catalog_type_hilo",
  item: "catalog_hilo",
} as const;

/** EF `UseHiLo` block size; sequences are `INCREMENT BY 10`. */
export const CATALOG_HILO_INCREMENT = 10;

export const CatalogForeignKeys = {
  itemBrand: "FK_Catalog_CatalogBrands_CatalogBrandId",
  itemType: "FK_Catalog_CatalogTypes_CatalogTypeId",
} as const;

/**
 * DDL that creates the catalog subset of the Catalog DB when it is missing.
 * Uses HiLo sequences (not IDENTITY) to match EF. Idempotent and non-destructive:
 * never drops tables or sequences — existing EF catalog data must survive cutover.
 */
export const CATALOG_SCHEMA_DDL = `
IF OBJECT_ID(N'[dbo].[catalog_brand_hilo]', N'SO') IS NULL
CREATE SEQUENCE [dbo].[catalog_brand_hilo] AS INT START WITH 1 INCREMENT BY 10;
IF OBJECT_ID(N'[dbo].[catalog_type_hilo]', N'SO') IS NULL
CREATE SEQUENCE [dbo].[catalog_type_hilo] AS INT START WITH 1 INCREMENT BY 10;
IF OBJECT_ID(N'[dbo].[catalog_hilo]', N'SO') IS NULL
CREATE SEQUENCE [dbo].[catalog_hilo] AS INT START WITH 1 INCREMENT BY 10;

IF OBJECT_ID(N'[dbo].[CatalogBrands]', N'U') IS NULL
CREATE TABLE [dbo].[CatalogBrands] (
  [Id] INT NOT NULL PRIMARY KEY,
  [Brand] NVARCHAR(100) NOT NULL
);

IF OBJECT_ID(N'[dbo].[CatalogTypes]', N'U') IS NULL
CREATE TABLE [dbo].[CatalogTypes] (
  [Id] INT NOT NULL PRIMARY KEY,
  [Type] NVARCHAR(100) NOT NULL
);

IF OBJECT_ID(N'[dbo].[Catalog]', N'U') IS NULL
CREATE TABLE [dbo].[Catalog] (
  [Id] INT NOT NULL PRIMARY KEY,
  [Name] NVARCHAR(50) NOT NULL,
  [Description] NVARCHAR(MAX) NOT NULL,
  [Price] DECIMAL(18,2) NOT NULL,
  [PictureUri] NVARCHAR(MAX) NULL,
  [CatalogTypeId] INT NOT NULL,
  [CatalogBrandId] INT NOT NULL,
  CONSTRAINT [FK_Catalog_CatalogBrands_CatalogBrandId]
    FOREIGN KEY ([CatalogBrandId]) REFERENCES [dbo].[CatalogBrands]([Id]) ON DELETE CASCADE,
  CONSTRAINT [FK_Catalog_CatalogTypes_CatalogTypeId]
    FOREIGN KEY ([CatalogTypeId]) REFERENCES [dbo].[CatalogTypes]([Id]) ON DELETE CASCADE
);

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_Catalog_CatalogBrandId' AND object_id = OBJECT_ID(N'[dbo].[Catalog]')
)
CREATE INDEX [IX_Catalog_CatalogBrandId] ON [dbo].[Catalog]([CatalogBrandId]);
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE name = N'IX_Catalog_CatalogTypeId' AND object_id = OBJECT_ID(N'[dbo].[Catalog]')
)
CREATE INDEX [IX_Catalog_CatalogTypeId] ON [dbo].[Catalog]([CatalogTypeId]);
`;
