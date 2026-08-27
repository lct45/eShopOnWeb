import Link from "next/link";

export type BasketStatusProps = {
  itemsCount?: number;
  href?: string;
};

/**
 * Basket icon + badge. Accessible name is "Basket" for Playwright parity.
 */
export function BasketStatus({
  itemsCount = 0,
  href = "/Basket",
}: BasketStatusProps) {
  return (
    <section className="col-lg-1 col-xs-12">
      <Link className="esh-basketstatus" href={href} aria-label="Basket">
        <div className="esh-basketstatus-image">
          <img src="/images/cart.png" alt="" />
        </div>
        <div className="esh-basketstatus-badge">{itemsCount}</div>
      </Link>
    </section>
  );
}
