import { describe, expect, it } from "vitest";
import {
  createSqlIdentityRepositories,
  getIdentityConnectionString,
  IDENTITY_SCHEMA_DDL,
  MssqlClient,
  seedDemoIdentity,
} from "@/data";
import { hashPassword, verifyPassword } from "@/auth/aspnet-identity-password";
import { DEMO_PASSWORD } from "@/shared/fixtures/identity";
import { Roles } from "@/shared/authorization/constants";

const connectionString = getIdentityConnectionString();

describe.runIf(Boolean(connectionString))(
  "SQL Server identity integration",
  () => {
    it("seeds demo users and verifies password hashes on live SQL Server", async () => {
      const client = new MssqlClient({ connectionString: connectionString! });
      try {
        await client.query(IDENTITY_SCHEMA_DDL);
        const repos = createSqlIdentityRepositories(client);
        await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);

        const admin = await repos.users.getByUserName("admin@microsoft.com");
        expect(admin).not.toBeNull();
        const roles = await repos.membership.getRoleNamesForUser(admin!.id);
        expect(roles).toContain(Roles.ADMINISTRATORS);

        const cred = await repos.credentials.getCredential(admin!.id);
        expect(verifyPassword(cred!.passwordHash!, DEMO_PASSWORD)).toBe(true);
      } finally {
        await client.close();
      }
    });
  },
);
