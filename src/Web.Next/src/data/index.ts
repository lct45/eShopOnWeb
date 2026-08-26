/**
 * Data module — SQL Server identity persistence (LCFM-6).
 *
 * Repository interfaces live in `@/domain/identity`. Implementations and SQL
 * mapping stay here so Next.js route handlers never talk to `mssql` directly.
 */

export {
  ClaimColumns,
  IdentityTables,
  LoginColumns,
  RoleColumns,
  TokenColumns,
  UserColumns,
  UserRoleColumns,
} from "@/data/sql/identity-schema";
export type {
  SqlExecutor,
  SqlParameter,
  SqlQueryResult,
  SqlRow,
} from "@/data/sql/sql-executor";
export { MemoryIdentitySqlExecutor } from "@/data/sql/memory-identity-sql-executor";
export type { IdentityDbState } from "@/data/sql/memory-identity-sql-executor";
export {
  getIdentityConnectionString,
  MssqlClient,
} from "@/data/sql/mssql-client";
export type { MssqlConnectionConfig } from "@/data/sql/mssql-client";
export {
  createSqlIdentityRepositories,
  SqlExternalLoginRepository,
  SqlRoleClaimRepository,
  SqlRoleMembershipRepository,
  SqlRoleRepository,
  SqlUserClaimRepository,
  SqlUserCredentialRepository,
  SqlUserRepository,
  SqlUserTokenRepository,
} from "@/data/repositories/sql-identity-repositories";
export { seedDemoIdentity } from "@/data/repositories/seed-demo-identity";
export type { SeedPasswordHasher } from "@/data/repositories/seed-demo-identity";
