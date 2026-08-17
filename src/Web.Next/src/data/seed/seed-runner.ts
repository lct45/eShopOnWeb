import {
  CATALOG_BRANDS,
  CATALOG_HILO_RESTART,
  CATALOG_ITEMS,
  CATALOG_TYPES,
  DEMO_PASSWORD,
  SEED_ROLES,
  SEED_USERS,
} from "@/shared/fixtures";
import {
  hashPassword,
  newSecurityStamp,
  verifyPassword,
} from "./identity-password";
import type { SeedStore } from "./seed-store";

export type SeedOptions = {
  /** Wipe commerce + catalog + identity rows before inserting. */
  reset: boolean;
};

export type SeedSummary = {
  brands: number;
  types: number;
  items: number;
  roles: number;
  users: number;
  userRoles: number;
  baskets: number;
  orders: number;
  reset: boolean;
};

/**
 * Ensure schema, optionally reset, then seed to the known .NET demo state.
 */
export async function seedWithStore(
  store: SeedStore,
  options: SeedOptions,
): Promise<SeedSummary> {
  await store.ensureSchema();

  if (options.reset) {
    await store.reset();
  }

  await store.insertBrands(CATALOG_BRANDS);
  await store.insertTypes(CATALOG_TYPES);
  await store.insertItems(CATALOG_ITEMS);
  await store.setHiloRestart(CATALOG_HILO_RESTART);

  await store.insertRoles(SEED_ROLES);

  const passwordHash = hashPassword(DEMO_PASSWORD);
  for (const user of SEED_USERS) {
    await store.insertUser(user, passwordHash, newSecurityStamp());
    for (const roleName of user.roles) {
      const role = SEED_ROLES.find((r) => r.name === roleName);
      if (!role) {
        throw new Error(`Unknown role in fixture: ${roleName}`);
      }
      await store.assignUserRole(user.id, role.id);
    }
  }

  const catalog = await store.catalogCounts();
  const identity = await store.identityCounts();

  return {
    brands: catalog.brands,
    types: catalog.types,
    items: catalog.items,
    roles: identity.roles,
    users: identity.users,
    userRoles: identity.userRoles,
    baskets: catalog.baskets,
    orders: catalog.orders,
    reset: options.reset,
  };
}

export async function verifySeededStore(store: SeedStore): Promise<void> {
  const brands = await store.listBrandNames();
  if (brands.length !== CATALOG_BRANDS.length) {
    throw new Error(
      `Expected ${CATALOG_BRANDS.length} brands, got ${brands.length}`,
    );
  }
  if (brands[1] !== ".NET") {
    throw new Error(`Expected brand id 2 to be .NET, got ${brands[1]}`);
  }

  const item = await store.getCatalogItem(1);
  if (
    !item ||
    item.name !== ".NET Bot Black Sweatshirt" ||
    item.price !== 19.5
  ) {
    throw new Error(
      "Catalog item 1 does not match .NET Bot Black Sweatshirt @ 19.5",
    );
  }

  const items = await store.catalogCounts();
  if (items.items !== 12) {
    throw new Error(`Expected 12 catalog items, got ${items.items}`);
  }

  const demo = await store.getUserByUserName("demouser@microsoft.com");
  if (!demo) {
    throw new Error("demouser@microsoft.com missing after seed");
  }
  if (!verifyPassword(demo.passwordHash, DEMO_PASSWORD)) {
    throw new Error("demouser password hash does not verify Pass@word1");
  }

  const admin = await store.getUserByUserName("admin@microsoft.com");
  if (!admin?.roleNames.includes("Administrators")) {
    throw new Error("admin@microsoft.com missing Administrators role");
  }

  const pm = await store.getUserByUserName("productmgr@microsoft.com");
  if (!pm?.roleNames.includes("Product Managers")) {
    throw new Error("productmgr@microsoft.com missing Product Managers role");
  }

  if (items.baskets !== 0 || items.orders !== 0) {
    throw new Error("Commerce tables should be empty after shared seed reset");
  }
}
