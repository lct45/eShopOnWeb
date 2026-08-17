/**
 * Environment configuration for SQL Server access.
 * Repositories (later tickets) consume these values; this module only reads env.
 */

export type DatabaseEnv = {
  catalogConnectionString: string | undefined;
  identityConnectionString: string | undefined;
  isConfigured: boolean;
};

type EnvLike = Record<string, string | undefined>;

function readOptional(env: EnvLike, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

/**
 * Resolve catalog/identity connection strings from process environment.
 * Compose injects these from a local `.env` file (never committed).
 */
export function getDatabaseEnv(env: EnvLike = process.env): DatabaseEnv {
  const catalogConnectionString = readOptional(
    env,
    "CATALOG_CONNECTION_STRING",
  );
  const identityConnectionString = readOptional(
    env,
    "IDENTITY_CONNECTION_STRING",
  );

  return {
    catalogConnectionString,
    identityConnectionString,
    isConfigured: Boolean(catalogConnectionString && identityConnectionString),
  };
}

/** Safe health payload — never includes connection strings or passwords. */
export function getDatabaseHealthSummary(env: EnvLike = process.env): {
  databaseConfigured: boolean;
} {
  return { databaseConfigured: getDatabaseEnv(env).isConfigured };
}
