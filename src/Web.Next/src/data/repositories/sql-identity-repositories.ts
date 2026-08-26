import { randomUUID } from "node:crypto";
import type { SqlExecutor, SqlRow } from "@/data/sql/sql-executor";
import {
  ClaimColumns,
  IdentityTables,
  LoginColumns,
  RoleColumns,
  TokenColumns,
  UserColumns,
  UserRoleColumns,
} from "@/data/sql/identity-schema";
import type {
  ExternalLoginRepository,
  IdentityRepositories,
  RoleClaimRepository,
  RoleMembershipRepository,
  RoleRepository,
  UserClaimRepository,
  UserCredentialRepository,
  UserRepository,
  UserTokenRepository,
} from "@/domain/identity/repository-ports";
import {
  toRolePublicDto,
  toUserPublicDto,
  type ApplicationRole,
  type ApplicationUser,
  type ExternalLogin,
  type NewApplicationRole,
  type NewApplicationUser,
  type NewRoleClaim,
  type NewUserClaim,
  type RoleClaim,
  type RolePublicDto,
  type UpdateApplicationUser,
  type UserClaim,
  type UserCredential,
  type UserPublicDto,
  type UserToken,
} from "@/domain/identity/types";

function requireString(row: SqlRow, key: string): string {
  const value = row[key];
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function optionalString(row: SqlRow, key: string): string | null {
  const value = row[key];
  if (value == null) return null;
  return String(value);
}

function requireBool(row: SqlRow, key: string): boolean {
  const value = row[key];
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === false) return false;
  return Boolean(value);
}

function requireNumber(row: SqlRow, key: string): number {
  const value = row[key];
  if (typeof value === "number") return value;
  return Number(value);
}

function optionalDate(row: SqlRow, key: string): Date | null {
  const value = row[key];
  if (value == null) return null;
  if (value instanceof Date) return value;
  return new Date(String(value));
}

function normalizeKey(value: string): string {
  return value.toUpperCase();
}

function mapUser(row: SqlRow): ApplicationUser {
  return {
    id: requireString(row, UserColumns.id),
    userName: optionalString(row, UserColumns.userName),
    normalizedUserName: optionalString(row, UserColumns.normalizedUserName),
    email: optionalString(row, UserColumns.email),
    normalizedEmail: optionalString(row, UserColumns.normalizedEmail),
    emailConfirmed: requireBool(row, UserColumns.emailConfirmed),
    phoneNumber: optionalString(row, UserColumns.phoneNumber),
    phoneNumberConfirmed: requireBool(row, UserColumns.phoneNumberConfirmed),
    twoFactorEnabled: requireBool(row, UserColumns.twoFactorEnabled),
    lockoutEnd: optionalDate(row, UserColumns.lockoutEnd),
    lockoutEnabled: requireBool(row, UserColumns.lockoutEnabled),
    accessFailedCount: requireNumber(row, UserColumns.accessFailedCount),
    concurrencyStamp: optionalString(row, UserColumns.concurrencyStamp),
  };
}

function mapUserWithCredential(row: SqlRow): ApplicationUser & UserCredential {
  return {
    ...mapUser(row),
    userId: requireString(row, UserColumns.id),
    passwordHash: optionalString(row, UserColumns.passwordHash),
    securityStamp: optionalString(row, UserColumns.securityStamp),
  };
}

function mapRole(row: SqlRow): ApplicationRole {
  return {
    id: requireString(row, RoleColumns.id),
    name: requireString(row, RoleColumns.name),
    normalizedName: requireString(row, RoleColumns.normalizedName),
    concurrencyStamp: optionalString(row, RoleColumns.concurrencyStamp),
  };
}

const USER_SELECT = `
  [${UserColumns.id}], [${UserColumns.userName}], [${UserColumns.normalizedUserName}],
  [${UserColumns.email}], [${UserColumns.normalizedEmail}], [${UserColumns.emailConfirmed}],
  [${UserColumns.passwordHash}], [${UserColumns.securityStamp}], [${UserColumns.concurrencyStamp}],
  [${UserColumns.phoneNumber}], [${UserColumns.phoneNumberConfirmed}],
  [${UserColumns.twoFactorEnabled}], [${UserColumns.lockoutEnd}],
  [${UserColumns.lockoutEnabled}], [${UserColumns.accessFailedCount}]
`;

export class SqlUserRepository implements UserRepository {
  constructor(private readonly db: SqlExecutor) {}

  toPublic(user: ApplicationUser): UserPublicDto {
    return toUserPublicDto(user);
  }

  async getById(id: string): Promise<ApplicationUser | null> {
    const result = await this.db.query(
      `SELECT ${USER_SELECT}
       FROM [dbo].[${IdentityTables.users}]
       WHERE [${UserColumns.id}] = ?`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async getByUserName(userName: string): Promise<ApplicationUser | null> {
    const result = await this.db.query(
      `SELECT ${USER_SELECT}
       FROM [dbo].[${IdentityTables.users}]
       WHERE [${UserColumns.normalizedUserName}] = ?`,
      [normalizeKey(userName)],
    );
    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async getByEmail(email: string): Promise<ApplicationUser | null> {
    const result = await this.db.query(
      `SELECT ${USER_SELECT}
       FROM [dbo].[${IdentityTables.users}]
       WHERE [${UserColumns.normalizedEmail}] = ?`,
      [normalizeKey(email)],
    );
    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  async list(): Promise<ApplicationUser[]> {
    const result = await this.db.query(
      `SELECT ${USER_SELECT}
       FROM [dbo].[${IdentityTables.users}]
       ORDER BY [${UserColumns.normalizedUserName}]`,
    );
    return result.rows.map(mapUser);
  }

  async create(user: NewApplicationUser): Promise<ApplicationUser> {
    const id = user.id ?? randomUUID();
    const concurrencyStamp = randomUUID();
    const securityStamp = randomUUID().replace(/-/g, "");
    await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.users}] (
         [${UserColumns.id}], [${UserColumns.userName}], [${UserColumns.normalizedUserName}],
         [${UserColumns.email}], [${UserColumns.normalizedEmail}], [${UserColumns.emailConfirmed}],
         [${UserColumns.passwordHash}], [${UserColumns.securityStamp}], [${UserColumns.concurrencyStamp}],
         [${UserColumns.phoneNumber}], [${UserColumns.phoneNumberConfirmed}],
         [${UserColumns.twoFactorEnabled}], [${UserColumns.lockoutEnd}],
         [${UserColumns.lockoutEnabled}], [${UserColumns.accessFailedCount}]
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user.userName,
        normalizeKey(user.userName),
        user.email,
        normalizeKey(user.email),
        user.emailConfirmed ?? false,
        user.passwordHash,
        securityStamp,
        concurrencyStamp,
        user.phoneNumber ?? null,
        user.phoneNumberConfirmed ?? false,
        user.twoFactorEnabled ?? false,
        null,
        user.lockoutEnabled ?? true,
        0,
      ],
    );
    const created = await this.getById(id);
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  async update(user: UpdateApplicationUser): Promise<ApplicationUser> {
    const existing = await this.getById(user.id);
    if (!existing) throw new Error(`User not found: ${user.id}`);

    const userName = user.userName ?? existing.userName ?? "";
    const email = user.email ?? existing.email ?? "";
    await this.db.query(
      `UPDATE [dbo].[${IdentityTables.users}]
       SET [${UserColumns.userName}] = ?,
           [${UserColumns.normalizedUserName}] = ?,
           [${UserColumns.email}] = ?,
           [${UserColumns.normalizedEmail}] = ?,
           [${UserColumns.emailConfirmed}] = ?,
           [${UserColumns.phoneNumber}] = ?,
           [${UserColumns.phoneNumberConfirmed}] = ?,
           [${UserColumns.twoFactorEnabled}] = ?,
           [${UserColumns.lockoutEnd}] = ?,
           [${UserColumns.lockoutEnabled}] = ?,
           [${UserColumns.accessFailedCount}] = ?,
           [${UserColumns.concurrencyStamp}] = ?
       WHERE [${UserColumns.id}] = ?`,
      [
        userName,
        normalizeKey(userName),
        email,
        normalizeKey(email),
        user.emailConfirmed ?? existing.emailConfirmed,
        user.phoneNumber === undefined
          ? existing.phoneNumber
          : user.phoneNumber,
        user.phoneNumberConfirmed ?? existing.phoneNumberConfirmed,
        user.twoFactorEnabled ?? existing.twoFactorEnabled,
        user.lockoutEnd === undefined ? existing.lockoutEnd : user.lockoutEnd,
        user.lockoutEnabled ?? existing.lockoutEnabled,
        user.accessFailedCount ?? existing.accessFailedCount,
        randomUUID(),
        user.id,
      ],
    );
    const updated = await this.getById(user.id);
    if (!updated) throw new Error("Failed to update user");
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.users}] WHERE [${UserColumns.id}] = ?`,
      [id],
    );
  }
}

export class SqlUserCredentialRepository implements UserCredentialRepository {
  constructor(private readonly db: SqlExecutor) {}

  async getByNormalizedUserName(
    normalizedUserName: string,
  ): Promise<(ApplicationUser & UserCredential) | null> {
    const result = await this.db.query(
      `SELECT ${USER_SELECT}
       FROM [dbo].[${IdentityTables.users}]
       WHERE [${UserColumns.normalizedUserName}] = ?`,
      [normalizeKey(normalizedUserName)],
    );
    const row = result.rows[0];
    return row ? mapUserWithCredential(row) : null;
  }

  async getCredential(userId: string): Promise<UserCredential | null> {
    const result = await this.db.query(
      `SELECT ${USER_SELECT}
       FROM [dbo].[${IdentityTables.users}]
       WHERE [${UserColumns.id}] = ?`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const mapped = mapUserWithCredential(row);
    return {
      userId: mapped.userId,
      passwordHash: mapped.passwordHash,
      securityStamp: mapped.securityStamp,
    };
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    const result = await this.db.query(
      `UPDATE [dbo].[${IdentityTables.users}]
       SET [${UserColumns.passwordHash}] = ?
       WHERE [${UserColumns.id}] = ?`,
      [passwordHash, userId],
    );
    if (result.rowsAffected === 0) {
      throw new Error(`User not found: ${userId}`);
    }
  }
}

export class SqlRoleRepository implements RoleRepository {
  constructor(private readonly db: SqlExecutor) {}

  toPublic(role: ApplicationRole): RolePublicDto {
    return toRolePublicDto(role);
  }

  async getById(id: string): Promise<ApplicationRole | null> {
    const result = await this.db.query(
      `SELECT [${RoleColumns.id}], [${RoleColumns.name}],
              [${RoleColumns.normalizedName}], [${RoleColumns.concurrencyStamp}]
       FROM [dbo].[${IdentityTables.roles}]
       WHERE [${RoleColumns.id}] = ?`,
      [id],
    );
    const row = result.rows[0];
    return row ? mapRole(row) : null;
  }

  async getByName(name: string): Promise<ApplicationRole | null> {
    const result = await this.db.query(
      `SELECT [${RoleColumns.id}], [${RoleColumns.name}],
              [${RoleColumns.normalizedName}], [${RoleColumns.concurrencyStamp}]
       FROM [dbo].[${IdentityTables.roles}]
       WHERE [${RoleColumns.normalizedName}] = ?`,
      [normalizeKey(name)],
    );
    const row = result.rows[0];
    return row ? mapRole(row) : null;
  }

  async list(): Promise<ApplicationRole[]> {
    const result = await this.db.query(
      `SELECT [${RoleColumns.id}], [${RoleColumns.name}],
              [${RoleColumns.normalizedName}], [${RoleColumns.concurrencyStamp}]
       FROM [dbo].[${IdentityTables.roles}]
       ORDER BY [${RoleColumns.normalizedName}]`,
    );
    return result.rows.map(mapRole);
  }

  async create(role: NewApplicationRole): Promise<ApplicationRole> {
    const id = role.id ?? randomUUID();
    await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.roles}] (
         [${RoleColumns.id}], [${RoleColumns.name}],
         [${RoleColumns.normalizedName}], [${RoleColumns.concurrencyStamp}]
       ) VALUES (?, ?, ?, ?)`,
      [id, role.name, normalizeKey(role.name), randomUUID()],
    );
    const created = await this.getById(id);
    if (!created) throw new Error("Failed to create role");
    return created;
  }

  async update(id: string, name: string): Promise<ApplicationRole> {
    await this.db.query(
      `UPDATE [dbo].[${IdentityTables.roles}]
       SET [${RoleColumns.name}] = ?,
           [${RoleColumns.normalizedName}] = ?,
           [${RoleColumns.concurrencyStamp}] = ?
       WHERE [${RoleColumns.id}] = ?`,
      [name, normalizeKey(name), randomUUID(), id],
    );
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Role not found: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.roles}] WHERE [${RoleColumns.id}] = ?`,
      [id],
    );
  }
}

export class SqlRoleMembershipRepository implements RoleMembershipRepository {
  constructor(
    private readonly db: SqlExecutor,
    private readonly roles: RoleRepository,
  ) {}

  async getRoleNamesForUser(userId: string): Promise<string[]> {
    const result = await this.db.query(
      `SELECT r.[${RoleColumns.name}] AS [Name]
       FROM [dbo].[${IdentityTables.roles}] r
       INNER JOIN [dbo].[${IdentityTables.userRoles}] ur
         ON ur.[${UserRoleColumns.roleId}] = r.[${RoleColumns.id}]
       WHERE ur.[${UserRoleColumns.userId}] = ?`,
      [userId],
    );
    return result.rows.map((row) => requireString(row, "Name"));
  }

  async getUsersInRole(roleName: string): Promise<ApplicationUser[]> {
    const result = await this.db.query(
      `SELECT u.[${UserColumns.id}], u.[${UserColumns.userName}], u.[${UserColumns.normalizedUserName}],
              u.[${UserColumns.email}], u.[${UserColumns.normalizedEmail}], u.[${UserColumns.emailConfirmed}],
              u.[${UserColumns.passwordHash}], u.[${UserColumns.securityStamp}], u.[${UserColumns.concurrencyStamp}],
              u.[${UserColumns.phoneNumber}], u.[${UserColumns.phoneNumberConfirmed}],
              u.[${UserColumns.twoFactorEnabled}], u.[${UserColumns.lockoutEnd}],
              u.[${UserColumns.lockoutEnabled}], u.[${UserColumns.accessFailedCount}]
       FROM [dbo].[${IdentityTables.users}] u
       INNER JOIN [dbo].[${IdentityTables.userRoles}] ur
         ON ur.[${UserRoleColumns.userId}] = u.[${UserColumns.id}]
       INNER JOIN [dbo].[${IdentityTables.roles}] r
         ON r.[${RoleColumns.id}] = ur.[${UserRoleColumns.roleId}]
       WHERE r.[${RoleColumns.normalizedName}] = ?`,
      [normalizeKey(roleName)],
    );
    return result.rows.map(mapUser);
  }

  async addUserToRole(userId: string, roleName: string): Promise<void> {
    const role = await this.roles.getByName(roleName);
    if (!role) throw new Error(`Role not found: ${roleName}`);
    await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.userRoles}] (
         [${UserRoleColumns.userId}], [${UserRoleColumns.roleId}]
       ) VALUES (?, ?)`,
      [userId, role.id],
    );
  }

  async removeUserFromRole(userId: string, roleName: string): Promise<void> {
    const role = await this.roles.getByName(roleName);
    if (!role) throw new Error(`Role not found: ${roleName}`);
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.userRoles}]
       WHERE [${UserRoleColumns.userId}] = ? AND [${UserRoleColumns.roleId}] = ?`,
      [userId, role.id],
    );
  }

  async setRolesForUser(
    userId: string,
    rolesToAdd: string[],
    rolesToRemove: string[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const roles = new SqlRoleRepository(tx);
      const membership = new SqlRoleMembershipRepository(tx, roles);
      for (const roleName of rolesToRemove) {
        await membership.removeUserFromRole(userId, roleName);
      }
      for (const roleName of rolesToAdd) {
        await membership.addUserToRole(userId, roleName);
      }
    });
  }
}

export class SqlUserClaimRepository implements UserClaimRepository {
  constructor(private readonly db: SqlExecutor) {}

  async listByUserId(userId: string): Promise<UserClaim[]> {
    const result = await this.db.query(
      `SELECT [${ClaimColumns.id}], [${ClaimColumns.userId}],
              [${ClaimColumns.claimType}], [${ClaimColumns.claimValue}]
       FROM [dbo].[${IdentityTables.userClaims}]
       WHERE [${ClaimColumns.userId}] = ?`,
      [userId],
    );
    return result.rows.map((row) => ({
      id: requireNumber(row, ClaimColumns.id),
      userId: requireString(row, ClaimColumns.userId),
      claimType: optionalString(row, ClaimColumns.claimType),
      claimValue: optionalString(row, ClaimColumns.claimValue),
    }));
  }

  async add(claim: NewUserClaim): Promise<UserClaim> {
    const result = await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.userClaims}] (
         [${ClaimColumns.userId}], [${ClaimColumns.claimType}], [${ClaimColumns.claimValue}]
       )
       OUTPUT INSERTED.[${ClaimColumns.id}]
       VALUES (?, ?, ?)`,
      [claim.userId, claim.claimType, claim.claimValue],
    );
    const insertedUserClaim = result.rows[0];
    if (!insertedUserClaim) throw new Error("Failed to insert user claim");
    const id = requireNumber(insertedUserClaim, ClaimColumns.id);
    return {
      id,
      userId: claim.userId,
      claimType: claim.claimType,
      claimValue: claim.claimValue,
    };
  }

  async remove(claimId: number): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.userClaims}] WHERE [${ClaimColumns.id}] = ?`,
      [claimId],
    );
  }
}

export class SqlRoleClaimRepository implements RoleClaimRepository {
  constructor(private readonly db: SqlExecutor) {}

  async listByRoleId(roleId: string): Promise<RoleClaim[]> {
    const result = await this.db.query(
      `SELECT [${ClaimColumns.id}], [${ClaimColumns.roleId}],
              [${ClaimColumns.claimType}], [${ClaimColumns.claimValue}]
       FROM [dbo].[${IdentityTables.roleClaims}]
       WHERE [${ClaimColumns.roleId}] = ?`,
      [roleId],
    );
    return result.rows.map((row) => ({
      id: requireNumber(row, ClaimColumns.id),
      roleId: requireString(row, ClaimColumns.roleId),
      claimType: optionalString(row, ClaimColumns.claimType),
      claimValue: optionalString(row, ClaimColumns.claimValue),
    }));
  }

  async add(claim: NewRoleClaim): Promise<RoleClaim> {
    const result = await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.roleClaims}] (
         [${ClaimColumns.roleId}], [${ClaimColumns.claimType}], [${ClaimColumns.claimValue}]
       )
       OUTPUT INSERTED.[${ClaimColumns.id}]
       VALUES (?, ?, ?)`,
      [claim.roleId, claim.claimType, claim.claimValue],
    );
    const insertedRoleClaim = result.rows[0];
    if (!insertedRoleClaim) throw new Error("Failed to insert role claim");
    const id = requireNumber(insertedRoleClaim, ClaimColumns.id);
    return {
      id,
      roleId: claim.roleId,
      claimType: claim.claimType,
      claimValue: claim.claimValue,
    };
  }

  async remove(claimId: number): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.roleClaims}] WHERE [${ClaimColumns.id}] = ?`,
      [claimId],
    );
  }
}

export class SqlExternalLoginRepository implements ExternalLoginRepository {
  constructor(private readonly db: SqlExecutor) {}

  async listByUserId(userId: string): Promise<ExternalLogin[]> {
    const result = await this.db.query(
      `SELECT [${LoginColumns.loginProvider}], [${LoginColumns.providerKey}],
              [${LoginColumns.providerDisplayName}], [${LoginColumns.userId}]
       FROM [dbo].[${IdentityTables.userLogins}]
       WHERE [${LoginColumns.userId}] = ?`,
      [userId],
    );
    return result.rows.map((row) => ({
      loginProvider: requireString(row, LoginColumns.loginProvider),
      providerKey: requireString(row, LoginColumns.providerKey),
      providerDisplayName: optionalString(
        row,
        LoginColumns.providerDisplayName,
      ),
      userId: requireString(row, LoginColumns.userId),
    }));
  }

  async find(
    loginProvider: string,
    providerKey: string,
  ): Promise<ExternalLogin | null> {
    const result = await this.db.query(
      `SELECT [${LoginColumns.loginProvider}], [${LoginColumns.providerKey}],
              [${LoginColumns.providerDisplayName}], [${LoginColumns.userId}]
       FROM [dbo].[${IdentityTables.userLogins}]
       WHERE [${LoginColumns.loginProvider}] = ? AND [${LoginColumns.providerKey}] = ?`,
      [loginProvider, providerKey],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      loginProvider: requireString(row, LoginColumns.loginProvider),
      providerKey: requireString(row, LoginColumns.providerKey),
      providerDisplayName: optionalString(
        row,
        LoginColumns.providerDisplayName,
      ),
      userId: requireString(row, LoginColumns.userId),
    };
  }

  async add(login: ExternalLogin): Promise<ExternalLogin> {
    await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.userLogins}] (
         [${LoginColumns.loginProvider}], [${LoginColumns.providerKey}],
         [${LoginColumns.providerDisplayName}], [${LoginColumns.userId}]
       ) VALUES (?, ?, ?, ?)`,
      [
        login.loginProvider,
        login.providerKey,
        login.providerDisplayName,
        login.userId,
      ],
    );
    return login;
  }

  async remove(loginProvider: string, providerKey: string): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.userLogins}]
       WHERE [${LoginColumns.loginProvider}] = ? AND [${LoginColumns.providerKey}] = ?`,
      [loginProvider, providerKey],
    );
  }
}

export class SqlUserTokenRepository implements UserTokenRepository {
  constructor(private readonly db: SqlExecutor) {}

  async get(
    userId: string,
    loginProvider: string,
    name: string,
  ): Promise<UserToken | null> {
    const result = await this.db.query(
      `SELECT [${TokenColumns.userId}], [${TokenColumns.loginProvider}],
              [${TokenColumns.name}], [${TokenColumns.value}]
       FROM [dbo].[${IdentityTables.userTokens}]
       WHERE [${TokenColumns.userId}] = ?
         AND [${TokenColumns.loginProvider}] = ?
         AND [${TokenColumns.name}] = ?`,
      [userId, loginProvider, name],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      userId: requireString(row, TokenColumns.userId),
      loginProvider: requireString(row, TokenColumns.loginProvider),
      name: requireString(row, TokenColumns.name),
      value: optionalString(row, TokenColumns.value),
    };
  }

  async set(token: UserToken): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.userTokens}]
       WHERE [${TokenColumns.userId}] = ?
         AND [${TokenColumns.loginProvider}] = ?
         AND [${TokenColumns.name}] = ?`,
      [token.userId, token.loginProvider, token.name],
    );
    await this.db.query(
      `INSERT INTO [dbo].[${IdentityTables.userTokens}] (
         [${TokenColumns.userId}], [${TokenColumns.loginProvider}],
         [${TokenColumns.name}], [${TokenColumns.value}]
       ) VALUES (?, ?, ?, ?)`,
      [token.userId, token.loginProvider, token.name, token.value],
    );
  }

  async remove(
    userId: string,
    loginProvider: string,
    name: string,
  ): Promise<void> {
    await this.db.query(
      `DELETE FROM [dbo].[${IdentityTables.userTokens}]
       WHERE [${TokenColumns.userId}] = ?
         AND [${TokenColumns.loginProvider}] = ?
         AND [${TokenColumns.name}] = ?`,
      [userId, loginProvider, name],
    );
  }
}

export function createSqlIdentityRepositories(
  db: SqlExecutor,
): IdentityRepositories {
  const roles = new SqlRoleRepository(db);
  return {
    users: new SqlUserRepository(db),
    credentials: new SqlUserCredentialRepository(db),
    roles,
    membership: new SqlRoleMembershipRepository(db, roles),
    userClaims: new SqlUserClaimRepository(db),
    roleClaims: new SqlRoleClaimRepository(db),
    logins: new SqlExternalLoginRepository(db),
    tokens: new SqlUserTokenRepository(db),
  };
}
