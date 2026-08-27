# Next.js app for eShopOnWeb (LCFM migration)

App Router foundation (LCFM-2) plus shared API contracts and authorization
constants (LCFM-3), and shared SQL Server seed fixtures (LCFM-42). No storefront
UI or auth flows yet.

## Scripts

| Script                            | Purpose                                                     |
| --------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                     | Local development server                                    |
| `npm run build`                   | Production build check                                      |
| `npm run start`                   | Serve the production build                                  |
| `npm run lint`                    | ESLint                                                      |
| `npm run format` / `format:check` | Prettier write / check                                      |
| `npm run typecheck`               | Strict TypeScript (`tsc --noEmit`)                          |
| `npm run test`                    | Vitest unit tests                                           |
| `npm run test:ci`                 | Vitest with JUnit + coverage (CI artifact producers)        |
| `npm run verify`                  | typecheck + lint + format + test + build                    |
| `npm run verify:ci`               | Full CI mirror: format + lint + typecheck + test:ci + build |
| `npm run db:seed`                 | Idempotent SQL Server seed               |
| `npm run db:reset`                | Wipe seeded tables, then seed            |

Runtime pin: Node 22 (see `.nvmrc`). Package manager pin: `npm@10.9.7`.

## CI

See [docs/ci.md](./docs/ci.md) for GitHub Actions gates, lockfile rules, artifacts,
and local commands that match the workflow (LCFM-25).

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

## Shared contracts

Import DTOs and role constants from `@/shared`:

```ts
import {
  Roles,
  type AuthenticateRequest,
  type CatalogItemDto,
  type UserDto,
} from "@/shared";
```

Wire field names are camelCase to match ASP.NET Core `JsonSerializerDefaults.Web`.
Vitest coverage lives in `src/shared/contracts/contracts.test.ts` and
`src/shared/authorization/constants.test.ts`.
