# Next.js app for eShopOnWeb (LCFM migration)

App Router foundation (LCFM-2) plus shared API contracts and authorization
constants (LCFM-3). LCFM-4 adds the shared visual shell and static asset
pipeline. No auth flows or database repositories yet.

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

## Shell and assets

- Root layout wraps pages in `AppShell` (header nav slots, footer, responsive containers).
- Page titles use the `%s - Microsoft.eShopOnWeb` metadata template.
- Brand, product images, Montserrat fonts, and favicon live under `public/`.
- Shared styles are imported from `src/styles/` (ported from `src/Web/wwwroot`).
- Reusable `LoadingState`, `EmptyState`, and `ErrorState` live in `src/shared/ui`.

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
