import Link from "next/link";
import type { ReactNode } from "react";
import { BasketStatus } from "./BasketStatus";
import { IdentityNav } from "./IdentityNav";

export type SiteHeaderProps = {
  /** Slot for login / identity chrome. Defaults to anonymous Login link. */
  identitySlot?: ReactNode;
  /** Slot for basket status. Defaults to empty Basket link. */
  basketSlot?: ReactNode;
};

export function SiteHeader({ identitySlot, basketSlot }: SiteHeaderProps) {
  return (
    <header className="esh-app-header">
      <div className="container">
        <article className="row">
          <section className="col-lg-7 col-md-6 col-xs-12">
            <Link href="/">
              <img src="/images/brand.png" alt="eShop On Web" />
            </Link>
          </section>
          {identitySlot ?? <IdentityNav />}
          {basketSlot ?? <BasketStatus />}
        </article>
      </div>
    </header>
  );
}
