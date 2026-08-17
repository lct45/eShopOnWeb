/**
 * Commerce tables exist in CatalogDb but are not pre-populated by the .NET
 * EF seeders. Shared fixtures document the empty known state after reset.
 */

export type EmptyCommerceState = {
  baskets: readonly never[];
  basketItems: readonly never[];
  orders: readonly never[];
  orderItems: readonly never[];
};

export const EMPTY_COMMERCE: EmptyCommerceState = {
  baskets: [],
  basketItems: [],
  orders: [],
  orderItems: [],
};
