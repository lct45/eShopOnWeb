import type { IdentityRepositories } from "@/domain/identity/repository-ports";
import { SEED_ROLES, SEED_USERS } from "@/shared/fixtures/identity";

export type SeedPasswordHasher = (password: string) => string;

/**
 * Inserts AppIdentityDbContextSeed demo roles/users/memberships.
 * Non-destructive for existing rows with the same stable IDs (skips duplicates).
 */
export async function seedDemoIdentity(
  repos: IdentityRepositories,
  hashPassword: SeedPasswordHasher,
  demoPassword: string,
): Promise<void> {
  for (const role of SEED_ROLES) {
    const existing = await repos.roles.getById(role.id);
    if (!existing) {
      await repos.roles.create({ id: role.id, name: role.name });
    }
  }

  for (const user of SEED_USERS) {
    const existing = await repos.users.getById(user.id);
    if (!existing) {
      await repos.users.create({
        id: user.id,
        userName: user.userName,
        email: user.email,
        emailConfirmed: true,
        passwordHash: hashPassword(demoPassword),
      });
    }

    const currentRoles = await repos.membership.getRoleNamesForUser(user.id);
    for (const roleName of user.roles) {
      if (!currentRoles.includes(roleName)) {
        await repos.membership.addUserToRole(user.id, roleName);
      }
    }
  }
}
