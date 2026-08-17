import type { Metadata } from "next";
import { getScaffoldStatus } from "@/shared/scaffold";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "eShopOnWeb Next.js scaffold",
  description: "Minimal Next.js foundation for the eShopOnWeb migration",
};

export default function Home() {
  const status = getScaffoldStatus();

  return (
    <main className={styles.main}>
      <h1>{status.name}</h1>
      <p>
        Migration scaffold is {status.ready ? "ready" : "not ready"}. Module
        boundaries: {status.modules.join(", ")}.
      </p>
    </main>
  );
}
