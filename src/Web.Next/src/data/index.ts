/**
 * Data module — SQL Server commerce persistence for baskets and orders (LCFM-7).
 *
 * Repository interfaces live in `@/domain/commerce`. Implementations and SQL
 * mapping stay here so domain code never imports `mssql` or other ORM clients.
 */

export {
  BasketColumns,
  BasketItemColumns,
  COMMERCE_SCHEMA_DDL,
  CommerceForeignKeys,
  CommerceTables,
  OrderColumns,
  OrderItemColumns,
} from "@/data/sql/commerce-schema";
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
  createSqlCommerceRepositories,
  SqlBasketRepository,
  SqlBuyerRepository,
  SqlCheckoutUnitOfWork,
  SqlOrderRepository,
} from "@/data/repositories/sql-commerce-repositories";
export type { CommerceRepositories } from "@/data/repositories/sql-commerce-repositories";
