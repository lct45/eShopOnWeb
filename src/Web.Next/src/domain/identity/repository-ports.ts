import type {
  ApplicationRole,
  ApplicationUser,
  ExternalLogin,
  NewApplicationRole,
  NewApplicationUser,
  NewRoleClaim,
  NewUserClaim,
  RoleClaim,
  RolePublicDto,
  UpdateApplicationUser,
  UserClaim,
  UserCredential,
  UserPublicDto,
  UserToken,
} from "@/domain/identity/types";

/**
 * ORM-agnostic persistence ports for ASP.NET Identity tables.
 * Implementations live in `@/data`; Auth.js and route handlers depend on these.
 */

export interface UserRepository {
  getById(id: string): Promise<ApplicationUser | null>;
  getByUserName(userName: string): Promise<ApplicationUser | null>;
  getByEmail(email: string): Promise<ApplicationUser | null>;
  list(): Promise<ApplicationUser[]>;
  create(user: NewApplicationUser): Promise<ApplicationUser>;
  update(user: UpdateApplicationUser): Promise<ApplicationUser>;
  delete(id: string): Promise<void>;
  /** Public DTO helper — never includes password hashes. */
  toPublic(user: ApplicationUser): UserPublicDto;
}

/**
 * Credential access for Auth.js verification only.
 * Callers must not log or return passwordHash over HTTP.
 */
export interface UserCredentialRepository {
  getByNormalizedUserName(
    normalizedUserName: string,
  ): Promise<(ApplicationUser & UserCredential) | null>;
  getCredential(userId: string): Promise<UserCredential | null>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
}

export interface RoleRepository {
  getById(id: string): Promise<ApplicationRole | null>;
  getByName(name: string): Promise<ApplicationRole | null>;
  list(): Promise<ApplicationRole[]>;
  create(role: NewApplicationRole): Promise<ApplicationRole>;
  update(id: string, name: string): Promise<ApplicationRole>;
  delete(id: string): Promise<void>;
  toPublic(role: ApplicationRole): RolePublicDto;
}

export interface RoleMembershipRepository {
  getRoleNamesForUser(userId: string): Promise<string[]>;
  getUsersInRole(roleName: string): Promise<ApplicationUser[]>;
  addUserToRole(userId: string, roleName: string): Promise<void>;
  removeUserFromRole(userId: string, roleName: string): Promise<void>;
  setRolesForUser(
    userId: string,
    rolesToAdd: string[],
    rolesToRemove: string[],
  ): Promise<void>;
}

export interface UserClaimRepository {
  listByUserId(userId: string): Promise<UserClaim[]>;
  add(claim: NewUserClaim): Promise<UserClaim>;
  remove(claimId: number): Promise<void>;
}

export interface RoleClaimRepository {
  listByRoleId(roleId: string): Promise<RoleClaim[]>;
  add(claim: NewRoleClaim): Promise<RoleClaim>;
  remove(claimId: number): Promise<void>;
}

export interface ExternalLoginRepository {
  listByUserId(userId: string): Promise<ExternalLogin[]>;
  find(
    loginProvider: string,
    providerKey: string,
  ): Promise<ExternalLogin | null>;
  add(login: ExternalLogin): Promise<ExternalLogin>;
  remove(loginProvider: string, providerKey: string): Promise<void>;
}

export interface UserTokenRepository {
  get(
    userId: string,
    loginProvider: string,
    name: string,
  ): Promise<UserToken | null>;
  set(token: UserToken): Promise<void>;
  remove(userId: string, loginProvider: string, name: string): Promise<void>;
}

export type IdentityRepositories = {
  users: UserRepository;
  credentials: UserCredentialRepository;
  roles: RoleRepository;
  membership: RoleMembershipRepository;
  userClaims: UserClaimRepository;
  roleClaims: RoleClaimRepository;
  logins: ExternalLoginRepository;
  tokens: UserTokenRepository;
};
