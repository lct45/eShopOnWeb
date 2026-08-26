/**
 * Identity DB table and column names matching AppIdentityDbContextModelSnapshot.
 * Do not rename — existing AspNet* rows must round-trip without schema changes.
 */

export const IdentityTables = {
  users: "AspNetUsers",
  roles: "AspNetRoles",
  userRoles: "AspNetUserRoles",
  userClaims: "AspNetUserClaims",
  roleClaims: "AspNetRoleClaims",
  userLogins: "AspNetUserLogins",
  userTokens: "AspNetUserTokens",
} as const;

export const UserColumns = {
  id: "Id",
  userName: "UserName",
  normalizedUserName: "NormalizedUserName",
  email: "Email",
  normalizedEmail: "NormalizedEmail",
  emailConfirmed: "EmailConfirmed",
  passwordHash: "PasswordHash",
  securityStamp: "SecurityStamp",
  concurrencyStamp: "ConcurrencyStamp",
  phoneNumber: "PhoneNumber",
  phoneNumberConfirmed: "PhoneNumberConfirmed",
  twoFactorEnabled: "TwoFactorEnabled",
  lockoutEnd: "LockoutEnd",
  lockoutEnabled: "LockoutEnabled",
  accessFailedCount: "AccessFailedCount",
} as const;

export const RoleColumns = {
  id: "Id",
  name: "Name",
  normalizedName: "NormalizedName",
  concurrencyStamp: "ConcurrencyStamp",
} as const;

export const UserRoleColumns = {
  userId: "UserId",
  roleId: "RoleId",
} as const;

export const ClaimColumns = {
  id: "Id",
  claimType: "ClaimType",
  claimValue: "ClaimValue",
  userId: "UserId",
  roleId: "RoleId",
} as const;

export const LoginColumns = {
  loginProvider: "LoginProvider",
  providerKey: "ProviderKey",
  providerDisplayName: "ProviderDisplayName",
  userId: "UserId",
} as const;

export const TokenColumns = {
  userId: "UserId",
  loginProvider: "LoginProvider",
  name: "Name",
  value: "Value",
} as const;
