import type {
  SqlExecutor,
  SqlParameter,
  SqlQueryResult,
  SqlRow,
} from "@/data/sql/sql-executor";

type UserRow = {
  Id: string;
  UserName: string | null;
  NormalizedUserName: string | null;
  Email: string | null;
  NormalizedEmail: string | null;
  EmailConfirmed: boolean;
  PasswordHash: string | null;
  SecurityStamp: string | null;
  ConcurrencyStamp: string | null;
  PhoneNumber: string | null;
  PhoneNumberConfirmed: boolean;
  TwoFactorEnabled: boolean;
  LockoutEnd: Date | null;
  LockoutEnabled: boolean;
  AccessFailedCount: number;
};

type RoleRow = {
  Id: string;
  Name: string | null;
  NormalizedName: string | null;
  ConcurrencyStamp: string | null;
};

type UserRoleRow = { UserId: string; RoleId: string };
type ClaimRow = {
  Id: number;
  UserId?: string;
  RoleId?: string;
  ClaimType: string | null;
  ClaimValue: string | null;
};
type LoginRow = {
  LoginProvider: string;
  ProviderKey: string;
  ProviderDisplayName: string | null;
  UserId: string;
};
type TokenRow = {
  UserId: string;
  LoginProvider: string;
  Name: string;
  Value: string | null;
};

export type IdentityDbState = {
  users: UserRow[];
  roles: RoleRow[];
  userRoles: UserRoleRow[];
  userClaims: ClaimRow[];
  roleClaims: ClaimRow[];
  logins: LoginRow[];
  tokens: TokenRow[];
  nextUserClaimId: number;
  nextRoleClaimId: number;
};

function cloneState(state: IdentityDbState): IdentityDbState {
  return {
    users: state.users.map((r) => ({ ...r })),
    roles: state.roles.map((r) => ({ ...r })),
    userRoles: state.userRoles.map((r) => ({ ...r })),
    userClaims: state.userClaims.map((r) => ({ ...r })),
    roleClaims: state.roleClaims.map((r) => ({ ...r })),
    logins: state.logins.map((r) => ({ ...r })),
    tokens: state.tokens.map((r) => ({ ...r })),
    nextUserClaimId: state.nextUserClaimId,
    nextRoleClaimId: state.nextRoleClaimId,
  };
}

function emptyState(): IdentityDbState {
  return {
    users: [],
    roles: [],
    userRoles: [],
    userClaims: [],
    roleClaims: [],
    logins: [],
    tokens: [],
    nextUserClaimId: 1,
    nextRoleClaimId: 1,
  };
}

function normalizeSql(sqlText: string): string {
  return sqlText.replace(/\s+/g, " ").trim();
}

function paramAt(params: SqlParameter[], index: number): SqlParameter {
  return params[index] ?? null;
}

function asBool(value: SqlParameter): boolean {
  return value === true || value === 1;
}

function asDate(value: SqlParameter): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  return new Date(String(value));
}

/**
 * In-memory executor for Identity SQL issued by Sql*Identity repositories.
 * Enforces CASCADE deletes for user/role dependents like SQL Server.
 */
export class MemoryIdentitySqlExecutor implements SqlExecutor {
  private state: IdentityDbState;
  private readonly transactionStack: IdentityDbState[] = [];

  constructor(seed?: IdentityDbState) {
    this.state = seed ? cloneState(seed) : emptyState();
  }

  snapshot(): IdentityDbState {
    return cloneState(this.state);
  }

  async query(
    sqlText: string,
    params: SqlParameter[] = [],
  ): Promise<SqlQueryResult> {
    const sql = normalizeSql(sqlText);

    if (/^INSERT INTO \[dbo\]\.\[AspNetUsers\]/i.test(sql)) {
      const row: UserRow = {
        Id: String(paramAt(params, 0)),
        UserName:
          paramAt(params, 1) == null ? null : String(paramAt(params, 1)),
        NormalizedUserName:
          paramAt(params, 2) == null ? null : String(paramAt(params, 2)),
        Email: paramAt(params, 3) == null ? null : String(paramAt(params, 3)),
        NormalizedEmail:
          paramAt(params, 4) == null ? null : String(paramAt(params, 4)),
        EmailConfirmed: asBool(paramAt(params, 5)),
        PasswordHash:
          paramAt(params, 6) == null ? null : String(paramAt(params, 6)),
        SecurityStamp:
          paramAt(params, 7) == null ? null : String(paramAt(params, 7)),
        ConcurrencyStamp:
          paramAt(params, 8) == null ? null : String(paramAt(params, 8)),
        PhoneNumber:
          paramAt(params, 9) == null ? null : String(paramAt(params, 9)),
        PhoneNumberConfirmed: asBool(paramAt(params, 10)),
        TwoFactorEnabled: asBool(paramAt(params, 11)),
        LockoutEnd: asDate(paramAt(params, 12)),
        LockoutEnabled: asBool(paramAt(params, 13)),
        AccessFailedCount: Number(paramAt(params, 14) ?? 0),
      };
      if (this.state.users.some((u) => u.Id === row.Id)) {
        throw new Error("PK violation: AspNetUsers.Id");
      }
      if (
        row.NormalizedUserName &&
        this.state.users.some(
          (u) => u.NormalizedUserName === row.NormalizedUserName,
        )
      ) {
        throw new Error("Unique violation: AspNetUsers.NormalizedUserName");
      }
      this.state.users.push(row);
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[AspNetRoles\]/i.test(sql)) {
      const row: RoleRow = {
        Id: String(params[0]),
        Name: params[1] == null ? null : String(params[1]),
        NormalizedName: params[2] == null ? null : String(params[2]),
        ConcurrencyStamp: params[3] == null ? null : String(params[3]),
      };
      if (
        row.NormalizedName &&
        this.state.roles.some((r) => r.NormalizedName === row.NormalizedName)
      ) {
        throw new Error("Unique violation: AspNetRoles.NormalizedName");
      }
      this.state.roles.push(row);
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[AspNetUserRoles\]/i.test(sql)) {
      const userId = String(params[0]);
      const roleId = String(params[1]);
      if (!this.state.users.some((u) => u.Id === userId)) {
        throw new Error("FK violation: AspNetUserRoles.UserId");
      }
      if (!this.state.roles.some((r) => r.Id === roleId)) {
        throw new Error("FK violation: AspNetUserRoles.RoleId");
      }
      if (
        this.state.userRoles.some(
          (ur) => ur.UserId === userId && ur.RoleId === roleId,
        )
      ) {
        return { rows: [], rowsAffected: 0 };
      }
      this.state.userRoles.push({ UserId: userId, RoleId: roleId });
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[AspNetUserClaims\]/i.test(sql)) {
      const row: ClaimRow = {
        Id: this.state.nextUserClaimId++,
        UserId: String(params[0]),
        ClaimType: String(params[1]),
        ClaimValue: String(params[2]),
      };
      if (!this.state.users.some((u) => u.Id === row.UserId)) {
        throw new Error("FK violation: AspNetUserClaims.UserId");
      }
      this.state.userClaims.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ Id: row.Id }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[AspNetRoleClaims\]/i.test(sql)) {
      const row: ClaimRow = {
        Id: this.state.nextRoleClaimId++,
        RoleId: String(params[0]),
        ClaimType: String(params[1]),
        ClaimValue: String(params[2]),
      };
      if (!this.state.roles.some((r) => r.Id === row.RoleId)) {
        throw new Error("FK violation: AspNetRoleClaims.RoleId");
      }
      this.state.roleClaims.push(row);
      if (/OUTPUT INSERTED/i.test(sql)) {
        return { rows: [{ Id: row.Id }], rowsAffected: 1 };
      }
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[AspNetUserLogins\]/i.test(sql)) {
      const row: LoginRow = {
        LoginProvider: String(params[0]),
        ProviderKey: String(params[1]),
        ProviderDisplayName: params[2] == null ? null : String(params[2]),
        UserId: String(params[3]),
      };
      if (!this.state.users.some((u) => u.Id === row.UserId)) {
        throw new Error("FK violation: AspNetUserLogins.UserId");
      }
      this.state.logins.push(row);
      return { rows: [], rowsAffected: 1 };
    }

    if (/^INSERT INTO \[dbo\]\.\[AspNetUserTokens\]/i.test(sql)) {
      const row: TokenRow = {
        UserId: String(params[0]),
        LoginProvider: String(params[1]),
        Name: String(params[2]),
        Value: params[3] == null ? null : String(params[3]),
      };
      if (!this.state.users.some((u) => u.Id === row.UserId)) {
        throw new Error("FK violation: AspNetUserTokens.UserId");
      }
      this.state.tokens = this.state.tokens.filter(
        (t) =>
          !(
            t.UserId === row.UserId &&
            t.LoginProvider === row.LoginProvider &&
            t.Name === row.Name
          ),
      );
      this.state.tokens.push(row);
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[AspNetUsers\] SET \[PasswordHash\]/i.test(sql)) {
      const hash = String(params[0]);
      const id = String(params[1]);
      const user = this.state.users.find((u) => u.Id === id);
      if (!user) return { rows: [], rowsAffected: 0 };
      user.PasswordHash = hash;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[AspNetUsers\]/i.test(sql)) {
      const id = String(params[params.length - 1]);
      const user = this.state.users.find((u) => u.Id === id);
      if (!user) return { rows: [], rowsAffected: 0 };
      // Param order matches SqlUserRepository.update
      user.UserName =
        paramAt(params, 0) == null ? null : String(paramAt(params, 0));
      user.NormalizedUserName =
        paramAt(params, 1) == null ? null : String(paramAt(params, 1));
      user.Email =
        paramAt(params, 2) == null ? null : String(paramAt(params, 2));
      user.NormalizedEmail =
        paramAt(params, 3) == null ? null : String(paramAt(params, 3));
      user.EmailConfirmed = asBool(paramAt(params, 4));
      user.PhoneNumber =
        paramAt(params, 5) == null ? null : String(paramAt(params, 5));
      user.PhoneNumberConfirmed = asBool(paramAt(params, 6));
      user.TwoFactorEnabled = asBool(paramAt(params, 7));
      user.LockoutEnd = asDate(paramAt(params, 8));
      user.LockoutEnabled = asBool(paramAt(params, 9));
      user.AccessFailedCount = Number(paramAt(params, 10) ?? 0);
      user.ConcurrencyStamp =
        paramAt(params, 11) == null ? null : String(paramAt(params, 11));
      return { rows: [], rowsAffected: 1 };
    }

    if (/^UPDATE \[dbo\]\.\[AspNetRoles\]/i.test(sql)) {
      const name = String(params[0]);
      const normalized = String(params[1]);
      const stamp = String(params[2]);
      const id = String(params[3]);
      const role = this.state.roles.find((r) => r.Id === id);
      if (!role) return { rows: [], rowsAffected: 0 };
      role.Name = name;
      role.NormalizedName = normalized;
      role.ConcurrencyStamp = stamp;
      return { rows: [], rowsAffected: 1 };
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetUsers\]/i.test(sql)) {
      const id = String(params[0]);
      const before = this.state.users.length;
      this.state.users = this.state.users.filter((u) => u.Id !== id);
      this.state.userRoles = this.state.userRoles.filter(
        (ur) => ur.UserId !== id,
      );
      this.state.userClaims = this.state.userClaims.filter(
        (c) => c.UserId !== id,
      );
      this.state.logins = this.state.logins.filter((l) => l.UserId !== id);
      this.state.tokens = this.state.tokens.filter((t) => t.UserId !== id);
      return {
        rows: [],
        rowsAffected: before === this.state.users.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetRoles\]/i.test(sql)) {
      const id = String(params[0]);
      const before = this.state.roles.length;
      this.state.roles = this.state.roles.filter((r) => r.Id !== id);
      this.state.userRoles = this.state.userRoles.filter(
        (ur) => ur.RoleId !== id,
      );
      this.state.roleClaims = this.state.roleClaims.filter(
        (c) => c.RoleId !== id,
      );
      return {
        rows: [],
        rowsAffected: before === this.state.roles.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetUserRoles\]/i.test(sql)) {
      if (/\[UserId\] = \? AND \[RoleId\] = \?/i.test(sql)) {
        const userId = String(params[0]);
        const roleId = String(params[1]);
        const before = this.state.userRoles.length;
        this.state.userRoles = this.state.userRoles.filter(
          (ur) => !(ur.UserId === userId && ur.RoleId === roleId),
        );
        return {
          rows: [],
          rowsAffected: before === this.state.userRoles.length ? 0 : 1,
        };
      }
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetUserClaims\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.userClaims.length;
      this.state.userClaims = this.state.userClaims.filter((c) => c.Id !== id);
      return {
        rows: [],
        rowsAffected: before === this.state.userClaims.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetRoleClaims\]/i.test(sql)) {
      const id = Number(params[0]);
      const before = this.state.roleClaims.length;
      this.state.roleClaims = this.state.roleClaims.filter((c) => c.Id !== id);
      return {
        rows: [],
        rowsAffected: before === this.state.roleClaims.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetUserLogins\]/i.test(sql)) {
      const provider = String(params[0]);
      const key = String(params[1]);
      const before = this.state.logins.length;
      this.state.logins = this.state.logins.filter(
        (l) => !(l.LoginProvider === provider && l.ProviderKey === key),
      );
      return {
        rows: [],
        rowsAffected: before === this.state.logins.length ? 0 : 1,
      };
    }

    if (/^DELETE FROM \[dbo\]\.\[AspNetUserTokens\]/i.test(sql)) {
      const userId = String(params[0]);
      const provider = String(params[1]);
      const name = String(params[2]);
      const before = this.state.tokens.length;
      this.state.tokens = this.state.tokens.filter(
        (t) =>
          !(
            t.UserId === userId &&
            t.LoginProvider === provider &&
            t.Name === name
          ),
      );
      return {
        rows: [],
        rowsAffected: before === this.state.tokens.length ? 0 : 1,
      };
    }

    if (/FROM \[dbo\]\.\[AspNetUsers\].*WHERE \[Id\] = \?/i.test(sql)) {
      const id = String(params[0]);
      const rows = this.state.users
        .filter((u) => u.Id === id)
        .map((u) => ({ ...u }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUsers\].*WHERE \[NormalizedUserName\] = \?/i.test(
        sql,
      )
    ) {
      const key = String(params[0]);
      const rows = this.state.users
        .filter((u) => u.NormalizedUserName === key)
        .map((u) => ({ ...u }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUsers\].*WHERE \[NormalizedEmail\] = \?/i.test(sql)
    ) {
      const key = String(params[0]);
      const rows = this.state.users
        .filter((u) => u.NormalizedEmail === key)
        .map((u) => ({ ...u }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUsers\]/i.test(sql) &&
      /ORDER BY \[NormalizedUserName\]/i.test(sql)
    ) {
      const rows = [...this.state.users]
        .sort((a, b) =>
          String(a.NormalizedUserName ?? "").localeCompare(
            String(b.NormalizedUserName ?? ""),
          ),
        )
        .map((u) => ({ ...u }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (/FROM \[dbo\]\.\[AspNetRoles\].*WHERE \[Id\] = \?/i.test(sql)) {
      const id = String(params[0]);
      const rows = this.state.roles
        .filter((r) => r.Id === id)
        .map((r) => ({ ...r }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetRoles\].*WHERE \[NormalizedName\] = \?/i.test(sql)
    ) {
      const key = String(params[0]);
      const rows = this.state.roles
        .filter((r) => r.NormalizedName === key)
        .map((r) => ({ ...r }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetRoles\]/i.test(sql) &&
      /ORDER BY \[NormalizedName\]/i.test(sql)
    ) {
      const rows = [...this.state.roles]
        .sort((a, b) =>
          String(a.NormalizedName ?? "").localeCompare(
            String(b.NormalizedName ?? ""),
          ),
        )
        .map((r) => ({ ...r }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetRoles\] r/i.test(sql) &&
      /JOIN \[dbo\]\.\[AspNetUserRoles\]/i.test(sql)
    ) {
      const userId = String(params[0]);
      const roleIds = this.state.userRoles
        .filter((ur) => ur.UserId === userId)
        .map((ur) => ur.RoleId);
      const rows = this.state.roles
        .filter((r) => roleIds.includes(r.Id))
        .map((r) => ({ Name: r.Name }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUsers\] u/i.test(sql) &&
      /JOIN \[dbo\]\.\[AspNetUserRoles\]/i.test(sql)
    ) {
      const normalizedRole = String(params[0]);
      const role = this.state.roles.find(
        (r) => r.NormalizedName === normalizedRole,
      );
      if (!role) return { rows: [], rowsAffected: 0 };
      const userIds = this.state.userRoles
        .filter((ur) => ur.RoleId === role.Id)
        .map((ur) => ur.UserId);
      const rows = this.state.users
        .filter((u) => userIds.includes(u.Id))
        .map((u) => ({ ...u }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUserClaims\].*WHERE \[UserId\] = \?/i.test(sql)
    ) {
      const userId = String(params[0]);
      const rows = this.state.userClaims
        .filter((c) => c.UserId === userId)
        .map((c) => ({ ...c }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetRoleClaims\].*WHERE \[RoleId\] = \?/i.test(sql)
    ) {
      const roleId = String(params[0]);
      const rows = this.state.roleClaims
        .filter((c) => c.RoleId === roleId)
        .map((c) => ({ ...c }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUserLogins\].*WHERE \[UserId\] = \?/i.test(sql)
    ) {
      const userId = String(params[0]);
      const rows = this.state.logins
        .filter((l) => l.UserId === userId)
        .map((l) => ({ ...l }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUserLogins\].*WHERE \[LoginProvider\] = \? AND \[ProviderKey\] = \?/i.test(
        sql,
      )
    ) {
      const provider = String(params[0]);
      const key = String(params[1]);
      const rows = this.state.logins
        .filter((l) => l.LoginProvider === provider && l.ProviderKey === key)
        .map((l) => ({ ...l }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    if (
      /FROM \[dbo\]\.\[AspNetUserTokens\].*WHERE \[UserId\] = \? AND \[LoginProvider\] = \? AND \[Name\] = \?/i.test(
        sql,
      )
    ) {
      const userId = String(params[0]);
      const provider = String(params[1]);
      const name = String(params[2]);
      const rows = this.state.tokens
        .filter(
          (t) =>
            t.UserId === userId &&
            t.LoginProvider === provider &&
            t.Name === name,
        )
        .map((t) => ({ ...t }) as SqlRow);
      return { rows, rowsAffected: rows.length };
    }

    throw new Error(`MemoryIdentitySqlExecutor does not support SQL: ${sql}`);
  }

  async transaction<T>(work: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    this.transactionStack.push(cloneState(this.state));
    try {
      const result = await work(this);
      this.transactionStack.pop();
      return result;
    } catch (error) {
      const previous = this.transactionStack.pop();
      if (previous) {
        this.state = previous;
      }
      throw error;
    }
  }
}
