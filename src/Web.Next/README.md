# Next.js app for eShopOnWeb (migration)

App Router foundation plus shared SQL Server seed fixtures (LCFM-42).

## Scripts

| Script                            | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Local development server                 |
| `npm run build`                   | Production build check                   |
| `npm run start`                   | Serve the production build               |
| `npm run lint`                    | ESLint                                   |
| `npm run format` / `format:check` | Prettier write / check                   |
| `npm run typecheck`               | Strict TypeScript (`tsc --noEmit`)       |
| `npm run test`                    | Vitest unit / system tests               |
| `npm run db:seed`                 | Idempotent SQL Server seed               |
| `npm run db:reset`                | Wipe seeded tables, then seed            |
| `npm run verify`                  | typecheck + lint + format + test + build |

## Shared seed (LCFM-42)

One command brings CatalogDb + Identity to the known demo state used by .NET
functional / PublicApi / Playwright tests:

```bash
# Option A — explicit DB connection strings
export ESHOP_CATALOG_CONNECTION='Server=localhost,1433;Database=Microsoft.eShopOnWeb.CatalogDb;User Id=sa;Password=...;TrustServerCertificate=true'
export ESHOP_IDENTITY_CONNECTION='Server=localhost,1433;Database=Microsoft.eShopOnWeb.Identity;User Id=sa;Password=...;TrustServerCertificate=true'

# Option B — server bootstrap (creates CatalogDb + Identity if missing)
export ESHOP_SQLSERVER='Server=localhost,1433;User Id=sa;Password=...;TrustServerCertificate=true'

npm run db:reset   # documented reset path
# or
npm run db:seed    # idempotent insert if rows already exist
```

Fixtures live in `src/shared/fixtures` (users, roles, 12 catalog items, brands,
types). Empty baskets/orders after reset match the .NET EF seeders.

Demo credentials (unchanged): `demouser@microsoft.com` / `Pass@word1`.
Password hashes are generated at seed time (ASP.NET Identity V3) — not committed.

## Module boundaries

See [MODULES.md](./MODULES.md) for import aliases and dependency rules.
