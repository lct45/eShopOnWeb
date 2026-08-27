import Link from "next/link";

export type IdentityNavProps = {
  /** When set, shows the authenticated identity chrome (name only; menus come later). */
  userName?: string | null;
};

/**
 * Default anonymous/authenticated identity chrome for the shell.
 * Feature tickets replace this via the header `identitySlot`.
 */
export function IdentityNav({ userName }: IdentityNavProps) {
  if (userName) {
    return (
      <section className="col-lg-4 col-md-5 col-xs-12">
        <div className="esh-identity">
          <section className="esh-identity-section">
            <div className="esh-identity-name">{userName}</div>
            <img
              className="esh-identity-image"
              src="/images/arrow-down.png"
              alt=""
            />
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="col-lg-4 col-md-5 col-xs-12">
      <div className="esh-identity">
        <section className="esh-identity-section">
          <div className="esh-identity-item">
            <Link
              href="/Identity/Account/Login"
              className="esh-identity-name esh-identity-name--upper"
            >
              Login
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
