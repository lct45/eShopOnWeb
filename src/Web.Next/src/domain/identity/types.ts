/**
 * ASP.NET Identity domain models matching AppIdentityDbContext / IdentityUser.
 * Public-facing shapes omit PasswordHash and SecurityStamp.
 */

export type ApplicationUser = {
  id: string;
  userName: string | null;
  normalizedUserName: string | null;
  email: string | null;
  normalizedEmail: string | null;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: Date | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  concurrencyStamp: string | null;
};

/** Credential fields stored on AspNetUsers — never serialize to API DTOs. */
export type UserCredential = {
  userId: string;
  passwordHash: string | null;
  securityStamp: string | null;
};

export type NewApplicationUser = {
  id?: string;
  userName: string;
  email: string;
  emailConfirmed?: boolean;
  phoneNumber?: string | null;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnabled?: boolean;
  /** Pre-hashed ASP.NET Identity V3 password hash. */
  passwordHash: string;
};

export type UpdateApplicationUser = {
  id: string;
  userName?: string;
  email?: string;
  emailConfirmed?: boolean;
  phoneNumber?: string | null;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: Date | null;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
};

export type ApplicationRole = {
  id: string;
  name: string;
  normalizedName: string;
  concurrencyStamp: string | null;
};

export type NewApplicationRole = {
  id?: string;
  name: string;
};

export type UserRoleMembership = {
  userId: string;
  roleId: string;
};

export type IdentityClaim = {
  id: number;
  claimType: string | null;
  claimValue: string | null;
};

export type UserClaim = IdentityClaim & { userId: string };
export type RoleClaim = IdentityClaim & { roleId: string };

export type NewUserClaim = {
  userId: string;
  claimType: string;
  claimValue: string;
};

export type NewRoleClaim = {
  roleId: string;
  claimType: string;
  claimValue: string;
};

export type ExternalLogin = {
  loginProvider: string;
  providerKey: string;
  providerDisplayName: string | null;
  userId: string;
};

export type UserToken = {
  userId: string;
  loginProvider: string;
  name: string;
  value: string | null;
};

/**
 * Safe DTO for API / UI layers. Intentionally excludes passwordHash,
 * securityStamp, and concurrencyStamp.
 */
export type UserPublicDto = {
  id: string;
  userName: string | null;
  email: string | null;
  emailConfirmed: boolean;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: string | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
};

export type RolePublicDto = {
  id: string;
  name: string;
};

export function toUserPublicDto(user: ApplicationUser): UserPublicDto {
  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    emailConfirmed: user.emailConfirmed,
    phoneNumber: user.phoneNumber,
    phoneNumberConfirmed: user.phoneNumberConfirmed,
    twoFactorEnabled: user.twoFactorEnabled,
    lockoutEnd: user.lockoutEnd ? user.lockoutEnd.toISOString() : null,
    lockoutEnabled: user.lockoutEnabled,
    accessFailedCount: user.accessFailedCount,
  };
}

export function toRolePublicDto(role: ApplicationRole): RolePublicDto {
  return {
    id: role.id,
    name: role.name,
  };
}

/** Assert a value has no password-hash-like keys (DTO guard for tests). */
export function assertNoSensitiveIdentityFields(
  value: Record<string, unknown>,
): void {
  const forbidden = [
    "passwordHash",
    "PasswordHash",
    "securityStamp",
    "SecurityStamp",
  ];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      throw new Error(
        `Sensitive identity field "${key}" must not appear on DTOs`,
      );
    }
  }
}
