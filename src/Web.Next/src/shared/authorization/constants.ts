/**
 * Role names and combinations used by PublicApi authz and BlazorAdmin.
 * Keep values identical to `src/BlazorShared/Authorization/Constants.cs`.
 */
export const Roles = {
  ADMINISTRATORS: "Administrators",
  PRODUCT_MANAGERS: "Product Managers",
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];

export const RoleCombinations = {
  ADMIN_PORTAL_ROLES: `${Roles.ADMINISTRATORS},${Roles.PRODUCT_MANAGERS}`,
} as const;
