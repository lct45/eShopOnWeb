/**
 * Data module — SQL Server catalog persistence for brands, types, and items (LCFM-5).
 *
 * Repository interfaces live in `@/domain/catalog`. Implementations and SQL
 * mapping stay here so domain code never imports `mssql` or other ORM clients.
 */

export {
  CATALOG_SCHEMA_DDL,
  CatalogBrandColumns,
  CatalogForeignKeys,
  CatalogItemColumns,
  CatalogSequences,
  CatalogTables,
  CatalogTypeColumns,
} from "@/data/sql/catalog-schema";
export type {
  SqlExecutor,
  SqlParameter,
  SqlQueryResult,
  SqlRow,
} from "@/data/sql/sql-executor";
export { MemorySqlExecutor } from "@/data/sql/memory-sql-executor";
export {
  getCatalogConnectionString,
  MssqlClient,
} from "@/data/sql/mssql-client";
export type { MssqlConnectionConfig } from "@/data/sql/mssql-client";
export {
  createSqlCatalogRepositories,
  SqlCatalogBrandRepository,
  SqlCatalogItemRepository,
  SqlCatalogTypeRepository,
} from "@/data/repositories/sql-catalog-repositories";
export type { CatalogRepositories } from "@/data/repositories/sql-catalog-repositories";
