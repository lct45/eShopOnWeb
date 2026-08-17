/**
 * End-to-end seed walkthrough used for LCFM-42 validation evidence.
 * Runs the same seedWithStore + verifySeededStore path as npm run db:reset,
 * against the in-memory SeedStore when SQL Server is not attached.
 *
 * Usage: npx tsx scripts/seed-e2e-demo.ts
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  InMemorySeedStore,
  seedWithStore,
  verifySeededStore,
} from "../src/data/seed";

async function main(): Promise<void> {
  const store = new InMemorySeedStore();
  const first = await seedWithStore(store, { reset: true });
  await verifySeededStore(store);

  // Mutate then reset to prove the documented reset path.
  (store as unknown as { baskets: number }).baskets = 9;
  const second = await seedWithStore(store, { reset: true });
  await verifySeededStore(store);

  const item = await store.getCatalogItem(1);
  const demo = await store.getUserByUserName("demouser@microsoft.com");

  const report = {
    ok: true,
    ticket: "LCFM-42",
    path: "seedWithStore → verifySeededStore",
    first,
    second,
    spotChecks: {
      catalogItem1: item,
      demouser: demo
        ? { userName: demo.userName, roles: demo.roleNames }
        : null,
    },
  };

  const outPath = resolve(
    __dirname,
    "../docs/validation/lcfm-42-seed-e2e.json",
  );
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  console.log(`Wrote ${outPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
