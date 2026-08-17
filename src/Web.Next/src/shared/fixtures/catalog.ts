/**
 * Catalog seed fixtures ported from CatalogContextSeed.cs.
 * IDs match EF HiLo first-block allocation used by the .NET seeders.
 */

export type CatalogBrandFixture = {
  id: number;
  brand: string;
};

export type CatalogTypeFixture = {
  id: number;
  type: string;
};

export type CatalogItemFixture = {
  id: number;
  catalogTypeId: number;
  catalogBrandId: number;
  name: string;
  description: string;
  price: number;
  pictureUri: string;
};

export const CATALOG_BRANDS: readonly CatalogBrandFixture[] = [
  { id: 1, brand: "Azure" },
  { id: 2, brand: ".NET" },
  { id: 3, brand: "Visual Studio" },
  { id: 4, brand: "SQL Server" },
  { id: 5, brand: "Other" },
] as const;

export const CATALOG_TYPES: readonly CatalogTypeFixture[] = [
  { id: 1, type: "Mug" },
  { id: 2, type: "T-Shirt" },
  { id: 3, type: "Sheet" },
  { id: 4, type: "USB Memory Stick" },
] as const;

const picture = (n: number) =>
  `http://catalogbaseurltobereplaced/images/products/${n}.png`;

export const CATALOG_ITEMS: readonly CatalogItemFixture[] = [
  {
    id: 1,
    catalogTypeId: 2,
    catalogBrandId: 2,
    name: ".NET Bot Black Sweatshirt",
    description: ".NET Bot Black Sweatshirt",
    price: 19.5,
    pictureUri: picture(1),
  },
  {
    id: 2,
    catalogTypeId: 1,
    catalogBrandId: 2,
    name: ".NET Black & White Mug",
    description: ".NET Black & White Mug",
    price: 8.5,
    pictureUri: picture(2),
  },
  {
    id: 3,
    catalogTypeId: 2,
    catalogBrandId: 5,
    name: "Prism White T-Shirt",
    description: "Prism White T-Shirt",
    price: 12,
    pictureUri: picture(3),
  },
  {
    id: 4,
    catalogTypeId: 2,
    catalogBrandId: 2,
    name: ".NET Foundation Sweatshirt",
    description: ".NET Foundation Sweatshirt",
    price: 12,
    pictureUri: picture(4),
  },
  {
    id: 5,
    catalogTypeId: 3,
    catalogBrandId: 5,
    name: "Roslyn Red Sheet",
    description: "Roslyn Red Sheet",
    price: 8.5,
    pictureUri: picture(5),
  },
  {
    id: 6,
    catalogTypeId: 2,
    catalogBrandId: 2,
    name: ".NET Blue Sweatshirt",
    description: ".NET Blue Sweatshirt",
    price: 12,
    pictureUri: picture(6),
  },
  {
    id: 7,
    catalogTypeId: 2,
    catalogBrandId: 5,
    name: "Roslyn Red T-Shirt",
    description: "Roslyn Red T-Shirt",
    price: 12,
    pictureUri: picture(7),
  },
  {
    id: 8,
    catalogTypeId: 2,
    catalogBrandId: 5,
    name: "Kudu Purple Sweatshirt",
    description: "Kudu Purple Sweatshirt",
    price: 8.5,
    pictureUri: picture(8),
  },
  {
    id: 9,
    catalogTypeId: 1,
    catalogBrandId: 5,
    name: "Cup<T> White Mug",
    description: "Cup<T> White Mug",
    price: 12,
    pictureUri: picture(9),
  },
  {
    id: 10,
    catalogTypeId: 3,
    catalogBrandId: 2,
    name: ".NET Foundation Sheet",
    description: ".NET Foundation Sheet",
    price: 12,
    pictureUri: picture(10),
  },
  {
    id: 11,
    catalogTypeId: 3,
    catalogBrandId: 2,
    name: "Cup<T> Sheet",
    description: "Cup<T> Sheet",
    price: 8.5,
    pictureUri: picture(11),
  },
  {
    id: 12,
    catalogTypeId: 2,
    catalogBrandId: 5,
    name: "Prism White TShirt",
    description: "Prism White TShirt",
    price: 12,
    pictureUri: picture(12),
  },
] as const;

/** HiLo sequences use increment 10; next free blocks after seed. */
export const CATALOG_HILO_RESTART = {
  catalog_brand_hilo: 11,
  catalog_type_hilo: 11,
  catalog_hilo: 21,
} as const;
