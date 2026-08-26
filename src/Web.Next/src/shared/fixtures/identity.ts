/**
 * Identity seed fixtures ported from AppIdentityDbContextSeed.cs.
 * Demo password matches AuthorizationConstants.DEFAULT_PASSWORD (demo only).
 */

import { Roles } from "@/shared/authorization/constants";

/** Documented demo password — never use outside local/demo seeds. */
export const DEMO_PASSWORD = "Pass@word1";

export type RoleFixture = {
  id: string;
  name: string;
  normalizedName: string;
};

export type UserFixture = {
  id: string;
  userName: string;
  email: string;
  roles: readonly string[];
};

/** Stable GUIDs so repository / Playwright tests can pin identities. */
export const SEED_ROLES: readonly RoleFixture[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: Roles.ADMINISTRATORS,
    normalizedName: "ADMINISTRATORS",
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    name: Roles.PRODUCT_MANAGERS,
    normalizedName: "PRODUCT MANAGERS",
  },
] as const;

export const SEED_USERS: readonly UserFixture[] = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    userName: "demouser@microsoft.com",
    email: "demouser@microsoft.com",
    roles: [],
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    userName: "productmgr@microsoft.com",
    email: "productmgr@microsoft.com",
    roles: [Roles.PRODUCT_MANAGERS],
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    userName: "admin@microsoft.com",
    email: "admin@microsoft.com",
    roles: [Roles.ADMINISTRATORS],
  },
] as const;
