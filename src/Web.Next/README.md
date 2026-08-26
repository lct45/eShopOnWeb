# Next.js app for eShopOnWeb (LCFM migration)

App Router foundation (LCFM-2), shared API contracts (LCFM-3), and identity SQL
Server models/repositories (LCFM-6).

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
| `npm run test:e2e:identity`       | Identity repository e2e (in-memory SQL)  |

Runtime pin: Node 22 (see `.nvmrc`). Package manager pin: `npm@10.9.7`.

## CI

See [docs/ci.md](./docs/ci.md) for GitHub Actions gates, lockfile rules, artifacts,
and local commands that match the workflow (LCFM-25).

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

## Identity repositories (LCFM-6)

```ts
import { hashPassword } from "@/auth";
import {
  createSqlIdentityRepositories,
  MemoryIdentitySqlExecutor,
  seedDemoIdentity,
} from "@/data";
import { DEMO_PASSWORD } from "@/shared";

const db = new MemoryIdentitySqlExecutor();
const repos = createSqlIdentityRepositories(db);
await seedDemoIdentity(repos, hashPassword, DEMO_PASSWORD);
```

Password compatibility notes:
[docs/identity-password-compatibility.md](./docs/identity-password-compatibility.md).

Optional live SQL Server tests set `IDENTITY_SQL_CONNECTION_STRING` (or
`ESHOP_IDENTITY_CONNECTION_STRING`).
