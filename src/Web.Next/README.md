# Next.js app for eShopOnWeb migration

## Scripts

| Script                            | Purpose                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                     | Local development server                                        |
| `npm run build`                   | Production build check                                          |
| `npm run start`                   | Serve the production build                                      |
| `npm run lint`                    | ESLint                                                          |
| `npm run format` / `format:check` | Prettier write / check                                          |
| `npm run typecheck`               | Strict TypeScript (`tsc --noEmit`)                              |
| `npm run test`                    | Vitest unit + commerce repository tests                         |
| `npm run test:e2e:commerce`       | Basket/order repository walkthrough (memory or live SQL Server) |
| `npm run verify`                  | typecheck + lint + format + test + build                        |

## Commerce SQL Server (LCFM-7)

Basket/order persistence lives under `src/data` with ORM-agnostic ports in
`src/domain/commerce`. Tables and owned columns match the existing Catalog DB
(`Baskets`, `BasketItems`, `Orders`, `OrderItems`). There is no `Buyers` table;
buyer identity is the `BuyerId` string.

Live SQL Server integration tests run when `CATALOG_SQL_CONNECTION_STRING` is
set (see `src/data/repositories/sql-commerce.integration.test.ts`).

## Module boundaries

See [MODULES.md](./MODULES.md) for import aliases and dependency rules.
