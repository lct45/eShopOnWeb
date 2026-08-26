/**
 * Catalog domain models mapped to the existing Catalog SQL Server schema.
 * Table names: CatalogBrands, CatalogTypes, Catalog (items).
 * IDs use EF HiLo sequences (catalog_brand_hilo, catalog_type_hilo, catalog_hilo).
 */

export type CatalogBrand = {
  id: number;
  brand: string;
};

export type CatalogType = {
  id: number;
  type: string;
};

export type CatalogItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  pictureUri: string;
  catalogTypeId: number;
  catalogBrandId: number;
};

export type NewCatalogBrand = {
  brand: string;
};

export type NewCatalogType = {
  type: string;
};

export type NewCatalogItem = {
  name: string;
  description: string;
  price: number;
  pictureUri: string;
  catalogTypeId: number;
  catalogBrandId: number;
};

/**
 * Optional brand/type filters matching CatalogFilterSpecification /
 * CatalogFilterPaginatedSpecification.
 */
export type CatalogItemFilter = {
  brandId?: number | null;
  typeId?: number | null;
};

export type CatalogItemPage = {
  skip: number;
  take: number;
};
