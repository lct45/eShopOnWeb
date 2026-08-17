import type {
  Basket,
  Buyer,
  CheckoutInput,
  NewBasket,
  NewOrder,
  Order,
} from "@/domain/commerce/types";

/**
 * ORM-agnostic persistence ports for commerce aggregates.
 * Implementations live in `@/data`; domain services must depend only on these.
 */

export interface BasketRepository {
  getById(id: number): Promise<Basket | null>;
  getByBuyerId(buyerId: string): Promise<Basket | null>;
  create(basket: NewBasket): Promise<Basket>;
  update(basket: Basket): Promise<Basket>;
  delete(id: number): Promise<void>;
}

export interface OrderRepository {
  getById(id: number): Promise<Order | null>;
  listByBuyerId(buyerId: string): Promise<Order[]>;
  create(order: NewOrder): Promise<Order>;
}

export interface BuyerRepository {
  /**
   * Resolve a buyer by identity. Returns null when the identity has never
   * appeared on a Basket or Order (there is no Buyers table).
   */
  getByIdentity(identityGuid: string): Promise<Buyer | null>;
  /** Return the buyer for an identity string (always succeeds; no insert). */
  ensure(identityGuid: string): Promise<Buyer>;
}

/**
 * Guarantees a single transaction for checkout: insert order (+ items)
 * then delete the basket (CASCADE clears BasketItems).
 */
export interface CheckoutUnitOfWork {
  createOrderAndClearBasket(input: CheckoutInput): Promise<Order>;
}
