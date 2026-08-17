#!/usr/bin/env node
/**
 * Single seed/reset entrypoint for local and CI SQL Server.
 *
 * Usage:
 *   npm run db:seed          # ensure schema + idempotent insert
 *   npm run db:reset         # wipe seeded tables then seed
 *
 * Env (either pair or server bootstrap):
 *   ESHOP_CATALOG_CONNECTION + ESHOP_IDENTITY_CONNECTION
 *   or ESHOP_SQLSERVER (creates CatalogDb + Identity if missing)
 */

import {
  ensureDatabasesExist,
  resolveSeedConnectionStrings,
} from "./connection";
import { seedWithStore, verifySeededStore } from "./seed-runner";
import { SqlServerSeedStore } from "./sql-server-store";

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "seed";
  if (mode !== "seed" && mode !== "reset") {
    console.error(`Unknown mode "${mode}". Use "seed" or "reset".`);
    process.exitCode = 1;
    return;
  }

  const reset = mode === "reset";
  const connections = resolveSeedConnectionStrings();
  if (connections.serverConnectionString) {
    await ensureDatabasesExist(connections.serverConnectionString);
  }

  const store = await SqlServerSeedStore.create({
    catalogConnectionString: connections.catalogConnectionString,
    identityConnectionString: connections.identityConnectionString,
  });
  try {
    const summary = await seedWithStore(store, { reset });
    await verifySeededStore(store);
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode,
          summary,
          notes: [
            "Demo password is the existing Pass@word1 constant only.",
            "Reset path: npm run db:reset (deletes catalog/identity/commerce rows, then reseeds).",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    await store.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
