/**
 * User management contracts from PublicApi UserManagementEndpoints.
 * Wire names: camelCase (ASP.NET Core Web defaults).
 */

export interface UserDto {
  id: string;
  userName?: string | null;
  email?: string | null;
  emailConfirmed: boolean;
  phoneNumber?: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  /** ISO-8601 DateTimeOffset string when present on the wire. */
  lockoutEnd?: string | null;
}

/**
 * Subset of ASP.NET Identity `IdentityUser` / `ApplicationUser` fields that
 * appear when PublicApi returns `ApplicationUser` directly (e.g. update user).
 * Sensitive hash fields are optional and should not be relied on by new clients.
 */
export interface ApplicationUserWire {
  id: string;
  userName?: string | null;
  normalizedUserName?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  emailConfirmed: boolean;
  passwordHash?: string | null;
  securityStamp?: string | null;
  concurrencyStamp?: string | null;
  phoneNumber?: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd?: string | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
}

export interface CreateUserRequest {
  user: UserDto;
}

export interface CreateUserResponse {
  userId: string;
}

export interface UpdateUserRequest {
  user: UserDto;
}

export interface UpdateUserResponse {
  user: ApplicationUserWire;
}

export interface GetUserResponse {
  user: UserDto;
}

export interface UserListResponse {
  users: UserDto[];
}

export interface GetByIdUserRequest {
  userId: string;
}

export interface GetByUserNameUserRequest {
  userName: string;
}

export interface DeleteUserRequest {
  userId: string;
}

export interface GetRolesByUserIdRequest {
  userId: string;
}

export interface GetUserRolesResponse {
  roles: string[];
}

export interface SaveRolesForUserRequest {
  userId: string;
  rolesToAdd: string[];
  rolesToRemove: string[];
}
