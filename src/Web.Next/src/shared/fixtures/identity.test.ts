import { describe, expect, it } from "vitest";
import { Roles } from "@/shared/authorization/constants";
import {
  DEMO_PASSWORD,
  SEED_ROLES,
  SEED_USERS,
} from "@/shared/fixtures/identity";

describe("identity fixtures", () => {
  it("matches AppIdentityDbContextSeed demo accounts and roles", () => {
    expect(DEMO_PASSWORD).toBe("Pass@word1");
    expect(SEED_ROLES.map((r) => r.name)).toEqual([
      Roles.ADMINISTRATORS,
      Roles.PRODUCT_MANAGERS,
    ]);
    expect(SEED_USERS.map((u) => u.userName)).toEqual([
      "demouser@microsoft.com",
      "productmgr@microsoft.com",
      "admin@microsoft.com",
    ]);
    expect(SEED_USERS[2]?.roles).toEqual([Roles.ADMINISTRATORS]);
  });
});
