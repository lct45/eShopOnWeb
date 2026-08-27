/**
 * End-to-end identity repository walkthrough (no HTTP).
 * Uses MemoryIdentitySqlExecutor so CI/agents can run without SQL Server.
 *
 * Run: npm run test:e2e:identity
 */
import { hashPassword, verifyPassword } from "@/auth/aspnet-identity-password";
import {
  createSqlIdentityRepositories,
  MemoryIdentitySqlExecutor,
  seedDemoIdentity,
} from "@/data";
import { assertNoSensitiveIdentityFields } from "@/domain/identity/types";
import { Roles } from "@/shared/authorization/constants";
import { DEMO_PASSWORD, SEED_USERS } from "@/shared/fixtures/identity";

async function main(): Promise<void> {
  const db = new MemoryIdentitySqlExecutor();
  const repos = createSqlIdentityRepositories(db);

  console.log("→ Seeding demo identity (AppIdentityDbContextSeed parity)...");
  await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);

  const users = await repos.users.list();
  console.log(`→ Users loaded: ${users.map((u) => u.userName).join(", ")}`);
  if (users.length !== 3) {
    throw new Error(`Expected 3 demo users, got ${users.length}`);
  }

  for (const user of users) {
    const dto = repos.users.toPublic(user);
    assertNoSensitiveIdentityFields(dto as unknown as Record<string, unknown>);
  }
  console.log("→ Public DTOs omit passwordHash / securityStamp");

  const admin = await repos.users.getByUserName("admin@microsoft.com");
  if (!admin) throw new Error("admin@microsoft.com missing");
  const adminRoles = await repos.membership.getRoleNamesForUser(admin.id);
  if (!adminRoles.includes(Roles.ADMINISTRATORS)) {
    throw new Error("admin missing Administrators role");
  }
  console.log(`→ admin roles: ${adminRoles.join(", ")}`);

  const cred = await repos.credentials.getByNormalizedUserName(
    "demouser@microsoft.com",
  );
  if (
    !cred?.passwordHash ||
    !verifyPassword(cred.passwordHash, DEMO_PASSWORD)
  ) {
    throw new Error("demo user password verification failed");
  }
  console.log("→ ASP.NET Identity V3 password verify OK for demouser");

  const reviewer = await repos.roles.create({ name: "Reviewers" });
  await repos.membership.addUserToRole(SEED_USERS[0]!.id, "Reviewers");
  const membership = await repos.membership.getRoleNamesForUser(
    SEED_USERS[0]!.id,
  );
  if (!membership.includes("Reviewers")) {
    throw new Error("membership add failed");
  }
  await repos.membership.removeUserFromRole(SEED_USERS[0]!.id, "Reviewers");
  await repos.roles.delete(reviewer.id);
  console.log("→ Role CRUD + membership add/remove OK");

  console.log("✓ identity e2e passed");
}

main().catch((error) => {
  console.error("✗ identity e2e failed");
  console.error(error);
  process.exitCode = 1;
});
