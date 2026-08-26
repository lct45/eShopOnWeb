import { describe, expect, it } from "vitest";
import {
  IDENTITY_SCHEMA_DDL,
  IdentityTables,
  UserColumns,
} from "@/data/sql/identity-schema";

describe("identity schema mapping", () => {
  it("preserves AspNet* table names from AppIdentityDbContext", () => {
    expect(IdentityTables.users).toBe("AspNetUsers");
    expect(IdentityTables.roles).toBe("AspNetRoles");
    expect(IdentityTables.userRoles).toBe("AspNetUserRoles");
    expect(IdentityTables.userClaims).toBe("AspNetUserClaims");
    expect(IdentityTables.roleClaims).toBe("AspNetRoleClaims");
    expect(IdentityTables.userLogins).toBe("AspNetUserLogins");
    expect(IdentityTables.userTokens).toBe("AspNetUserTokens");
  });

  it("includes password credential columns without renaming", () => {
    expect(UserColumns.passwordHash).toBe("PasswordHash");
    expect(UserColumns.securityStamp).toBe("SecurityStamp");
    expect(IDENTITY_SCHEMA_DDL).toContain("[PasswordHash]");
    expect(IDENTITY_SCHEMA_DDL).toContain("[AspNetUsers]");
  });
});
