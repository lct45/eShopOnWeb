import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Catalog",
  description: "eShopOnWeb catalog shell",
};

/**
 * Shell homepage placeholder. Catalog data fetching arrives in LCFM-12.
 */
export default function Home() {
  return (
    <div className={styles.shellHome}>
      <h1 className={styles.heading}>eShopOnWeb</h1>
      <p className={styles.copy}>
        Application shell and static assets are ready. Catalog, basket, and
        account features land in later migration tickets.
      </p>
    </div>
  );
}
