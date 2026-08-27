/**
 * Data module: SQL Server adapters, repositories, and shared seed tooling.
 * Domain may depend on abstractions defined here; UI should not.
 */

export {
  InMemorySeedStore,
  seedWithStore,
  SqlServerSeedStore,
  verifySeededStore,
} from "./seed";
export type {
  SeedOptions,
  SeedStore,
  SeedSummary,
  SqlServerSeedConfig,
} from "./seed";
