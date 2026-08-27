/**
 * Identity seed fixtures ported from AppIdentityDbContextSeed.cs.
 * Password matches AuthorizationConstants.DEFAULT_PASSWORD (demo only).
 */

export const DEMO_PASSWORD = "Pass@word1";

export const ROLES = {
  ADMINISTRATORS: "Administrators",
  PRODUCT_MANAGERS: "Product Managers",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export type RoleFixture = {
  id: string;
  name: RoleName;
  normalizedName: string;
};

export type UserFixture = {
  id: string;
  userName: string;
  email: string;
  roles: readonly RoleName[];
};

/** Stable GUIDs so repository / Playwright tests can pin identities. */
export const SEED_ROLES: readonly RoleFixture[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: ROLES.ADMINISTRATORS,
    normalizedName: "ADMINISTRATORS",
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    name: ROLES.PRODUCT_MANAGERS,
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
    roles: [ROLES.PRODUCT_MANAGERS],
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    userName: "admin@microsoft.com",
    email: "admin@microsoft.com",
    roles: [ROLES.ADMINISTRATORS],
  },
] as const;
