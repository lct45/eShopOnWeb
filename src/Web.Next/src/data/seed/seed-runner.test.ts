import { describe, expect, it } from "vitest";
import { InMemorySeedStore } from "./in-memory-store";
import { seedWithStore, verifySeededStore } from "./seed-runner";

describe("shared seed runner (system)", () => {
  it("seeds a clean store to the known demo state in one call", async () => {
    const store = new InMemorySeedStore();
    const summary = await seedWithStore(store, { reset: true });

    expect(summary).toMatchObject({
      brands: 5,
      types: 4,
      items: 12,
      roles: 2,
      users: 3,
      userRoles: 2,
      baskets: 0,
      orders: 0,
      reset: true,
    });

    await verifySeededStore(store);
  });

  it("is idempotent when reset is false on an already-seeded store", async () => {
    const store = new InMemorySeedStore();
    await seedWithStore(store, { reset: true });
    const second = await seedWithStore(store, { reset: false });
    expect(second.items).toBe(12);
    expect(second.users).toBe(3);
    await verifySeededStore(store);
  });

  it("reset path clears mutated commerce counts before reseeding", async () => {
    const store = new InMemorySeedStore();
    await seedWithStore(store, { reset: true });
    // Simulate leftover commerce rows from a prior test run.
    (store as unknown as { baskets: number; orders: number }).baskets = 3;
    (store as unknown as { baskets: number; orders: number }).orders = 2;

    const summary = await seedWithStore(store, { reset: true });
    expect(summary.baskets).toBe(0);
    expect(summary.orders).toBe(0);
    await verifySeededStore(store);
  });
});
