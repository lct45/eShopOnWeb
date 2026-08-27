import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/auth/aspnet-identity-password";
import {
  createSqlIdentityRepositories,
  MemoryIdentitySqlExecutor,
  seedDemoIdentity,
} from "@/data";
import {
  assertNoSensitiveIdentityFields,
  toUserPublicDto,
} from "@/domain/identity/types";
import { Roles } from "@/shared/authorization/constants";
import {
  DEMO_PASSWORD,
  SEED_ROLES,
  SEED_USERS,
} from "@/shared/fixtures/identity";

function createRepos() {
  const db = new MemoryIdentitySqlExecutor();
  return { db, repos: createSqlIdentityRepositories(db) };
}

describe("Sql identity repositories", () => {
  it("looks up seeded demo users without exposing password hashes on DTOs", async () => {
    const { repos } = createRepos();
    await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);

    const demo = await repos.users.getByUserName("demouser@microsoft.com");
    expect(demo).not.toBeNull();
    expect(demo!.email).toBe("demouser@microsoft.com");

    const dto = repos.users.toPublic(demo!);
    assertNoSensitiveIdentityFields(dto as unknown as Record<string, unknown>);
    expect(JSON.stringify(dto)).not.toMatch(/passwordHash|Pass@word1/i);

    const adminRoles = await repos.membership.getRoleNamesForUser(
      SEED_USERS[2]!.id,
    );
    expect(adminRoles).toEqual([Roles.ADMINISTRATORS]);

    const productRoles = await repos.membership.getRoleNamesForUser(
      SEED_USERS[1]!.id,
    );
    expect(productRoles).toEqual([Roles.PRODUCT_MANAGERS]);

    const demoRoles = await repos.membership.getRoleNamesForUser(
      SEED_USERS[0]!.id,
    );
    expect(demoRoles).toEqual([]);
  });

  it("supports user CRUD", async () => {
    const { repos } = createRepos();
    const created = await repos.users.create({
      userName: "newuser@example.com",
      email: "newuser@example.com",
      passwordHash: hashPassword("Temp@1234"),
    });
    expect(created.id).toBeTruthy();

    const byEmail = await repos.users.getByEmail("newuser@example.com");
    expect(byEmail?.id).toBe(created.id);

    const updated = await repos.users.update({
      id: created.id,
      phoneNumber: "555-0100",
      emailConfirmed: true,
    });
    expect(updated.phoneNumber).toBe("555-0100");
    expect(updated.emailConfirmed).toBe(true);

    await repos.users.delete(created.id);
    expect(await repos.users.getById(created.id)).toBeNull();
  });

  it("supports role CRUD and membership changes", async () => {
    const { repos } = createRepos();
    await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);

    const role = await repos.roles.create({ name: "Reviewers" });
    expect(role.normalizedName).toBe("REVIEWERS");

    const renamed = await repos.roles.update(role.id, "Editors");
    expect(renamed.name).toBe("Editors");

    const userId = SEED_USERS[0]!.id;
    await repos.membership.addUserToRole(userId, "Editors");
    expect(await repos.membership.getRoleNamesForUser(userId)).toContain(
      "Editors",
    );

    const members = await repos.membership.getUsersInRole("Editors");
    expect(members.map((u) => u.id)).toContain(userId);

    await repos.membership.setRolesForUser(
      userId,
      [Roles.PRODUCT_MANAGERS],
      ["Editors"],
    );
    const after = await repos.membership.getRoleNamesForUser(userId);
    expect(after).toEqual([Roles.PRODUCT_MANAGERS]);

    await repos.roles.delete(role.id);
    expect(await repos.roles.getById(role.id)).toBeNull();
  });

  it("verifies ASP.NET Identity V3 hashes via credential repository", async () => {
    const { repos } = createRepos();
    await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);

    const cred = await repos.credentials.getByNormalizedUserName(
      "admin@microsoft.com",
    );
    expect(cred?.passwordHash).toBeTruthy();
    expect(verifyPassword(cred!.passwordHash!, DEMO_PASSWORD)).toBe(true);
    expect(verifyPassword(cred!.passwordHash!, "nope")).toBe(false);

    // Credential shape is internal — public DTO still strips hash.
    const publicDto = toUserPublicDto(cred!);
    assertNoSensitiveIdentityFields(
      publicDto as unknown as Record<string, unknown>,
    );
  });

  it("models claims, external logins, and tokens", async () => {
    const { repos } = createRepos();
    await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);
    const userId = SEED_USERS[0]!.id;

    const claim = await repos.userClaims.add({
      userId,
      claimType: "permission",
      claimValue: "catalog.read",
    });
    expect(
      (await repos.userClaims.listByUserId(userId)).map((c) => c.id),
    ).toContain(claim.id);
    await repos.userClaims.remove(claim.id);

    const role = (await repos.roles.getByName(Roles.ADMINISTRATORS))!;
    const roleClaim = await repos.roleClaims.add({
      roleId: role.id,
      claimType: "scope",
      claimValue: "admin",
    });
    expect(
      (await repos.roleClaims.listByRoleId(role.id)).map((c) => c.id),
    ).toContain(roleClaim.id);

    await repos.logins.add({
      loginProvider: "GitHub",
      providerKey: "gh-123",
      providerDisplayName: "GitHub",
      userId,
    });
    expect((await repos.logins.find("GitHub", "gh-123"))?.userId).toBe(userId);
    await repos.logins.remove("GitHub", "gh-123");

    await repos.tokens.set({
      userId,
      loginProvider: "[AspNetUserStore]",
      name: "AuthenticatorKey",
      value: "otp-secret",
    });
    expect(
      (await repos.tokens.get(userId, "[AspNetUserStore]", "AuthenticatorKey"))
        ?.value,
    ).toBe("otp-secret");
    await repos.tokens.set({
      userId,
      loginProvider: "[AspNetUserStore]",
      name: "AuthenticatorKey",
      value: "otp-secret-rotated",
    });
    expect(
      (await repos.tokens.get(userId, "[AspNetUserStore]", "AuthenticatorKey"))
        ?.value,
    ).toBe("otp-secret-rotated");
    await repos.tokens.remove(userId, "[AspNetUserStore]", "AuthenticatorKey");
  });

  it("rolls back membership changes when a role is missing", async () => {
    const { repos } = createRepos();
    await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);
    const userId = SEED_USERS[0]!.id;

    await expect(
      repos.membership.setRolesForUser(userId, ["MissingRole"], []),
    ).rejects.toThrow(/Role not found/);

    expect(await repos.membership.getRoleNamesForUser(userId)).toEqual([]);
  });

  it("treats adding an existing role membership as idempotent", async () => {
    const { db, repos } = createRepos();
    await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);
    const userId = SEED_USERS[2]!.id;

    await repos.membership.addUserToRole(userId, Roles.ADMINISTRATORS);
    await repos.membership.setRolesForUser(userId, [Roles.ADMINISTRATORS], []);
    expect(await repos.membership.getRoleNamesForUser(userId)).toEqual([
      Roles.ADMINISTRATORS,
    ]);

    await expect(
      db.query(
        `INSERT INTO [dbo].[AspNetUserRoles] (
           [UserId], [RoleId]
         ) VALUES (?, ?)`,
        [userId, SEED_ROLES[0]!.id],
      ),
    ).rejects.toThrow(/PK violation: AspNetUserRoles/);
  });
});
