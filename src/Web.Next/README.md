# Next.js app for eShopOnWeb (LCFM migration)

App Router foundation (LCFM-2) plus shared API contracts and authorization
constants (LCFM-3). No storefront UI, auth flows, or database integration yet.

## Scripts

| Script                            | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Local development server                 |
| `npm run build`                   | Production build check                   |
| `npm run start`                   | Serve the production build               |
| `npm run lint`                    | ESLint                                   |
| `npm run format` / `format:check` | Prettier write / check                   |
| `npm run typecheck`               | Strict TypeScript (`tsc --noEmit`)       |
| `npm run test`                    | Vitest unit tests                        |
| `npm run verify`                  | typecheck + lint + format + test + build |

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
