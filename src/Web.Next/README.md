# Next.js app for eShopOnWeb (LCFM migration)

App Router foundation (LCFM-2) plus shared API contracts and authorization
constants (LCFM-3). Container orchestration for this app is documented in
[docs/docker-local-nextjs.md](../../docs/docker-local-nextjs.md) (LCFM-26).
No storefront UI, auth flows, or database repositories yet.

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

Runtime pin: Node 22 (see `.nvmrc`). Package manager pin: `npm@10.9.7`.

## CI

See [docs/ci.md](./docs/ci.md) for GitHub Actions gates, lockfile rules, artifacts,
and local commands that match the workflow (LCFM-25).

## Docker (production image + SQL Server)

```bash
# From repository root
cp .env.example .env   # set MSSQL_SA_PASSWORD and connection strings
docker compose up --build -d
curl -sS http://localhost:3000/api/health
```

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
