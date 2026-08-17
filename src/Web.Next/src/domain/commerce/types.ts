/**
 * Commerce domain models mapped to the existing Catalog SQL Server schema.
 * There is no Buyers table — buyer identity is the BuyerId string on Baskets/Orders.
 */

export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

export type CatalogItemOrdered = {
  catalogItemId: number;
  productName: string;
  pictureUri: string;
};

export type BasketItem = {
  id: number;
  basketId: number;
  catalogItemId: number;
  quantity: number;
  unitPrice: number;
};

export type Basket = {
  id: number;
  buyerId: string;
  items: BasketItem[];
};

export type OrderItem = {
  id: number;
  orderId: number | null;
  unitPrice: number;
  units: number;
  itemOrdered: CatalogItemOrdered;
};

export type Order = {
  id: number;
  buyerId: string;
  orderDate: Date;
  shipToAddress: Address;
  orderItems: OrderItem[];
};

/** Buyer aggregate as used by the storefront: identity only (no persistence table). */
export type Buyer = {
  identityGuid: string;
};

export type NewBasketItem = {
  catalogItemId: number;
  quantity: number;
  unitPrice: number;
};

export type NewBasket = {
  buyerId: string;
  items?: NewBasketItem[];
};

export type NewOrderItem = {
  unitPrice: number;
  units: number;
  itemOrdered: CatalogItemOrdered;
};

export type NewOrder = {
  buyerId: string;
  shipToAddress: Address;
  orderItems: NewOrderItem[];
  orderDate?: Date;
};

export type CheckoutInput = {
  basketId: number;
  shipToAddress: Address;
  /** Optional override of line items (defaults to current basket items). */
  orderItems?: NewOrderItem[];
};
