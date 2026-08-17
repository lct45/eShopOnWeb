# Module boundaries

This Next.js package keeps migration work parallelizable by isolating concerns
into top-level modules under `src/`.

## Layout

| Module   | Path         | Responsibility                                          |
| -------- | ------------ | ------------------------------------------------------- |
| `app`    | `src/app`    | Next.js App Router routes, layouts, and UI entry points |
| `domain` | `src/domain` | Pure business rules (catalog, basket, order)            |
| `data`   | `src/data`   | Persistence adapters, SQL Server seed, repositories     |
| `auth`   | `src/auth`   | Identity, sessions, and authorization helpers           |
| `shared` | `src/shared` | Cross-cutting types, demo fixtures, shared utilities    |

## Import aliases

Configured in `tsconfig.json` (and mirrored for Vitest):

| Alias        | Resolves to    |
| ------------ | -------------- |
| `@/app/*`    | `src/app/*`    |
| `@/domain/*` | `src/domain/*` |
| `@/data/*`   | `src/data/*`   |
| `@/auth/*`   | `src/auth/*`   |
| `@/shared/*` | `src/shared/*` |
| `@/*`        | `src/*`        |

Prefer the module-specific aliases when crossing boundaries.

## Dependency rules

Allowed direction (left may import right):

```
app → auth | domain | data | shared
auth → data | shared
domain → shared
data → domain | shared
shared → (nothing from other modules)
```

Disallowed:

- `domain` must not import `app`, `auth`, or `data` implementations
- `shared` must not import `app`, `domain`, `data`, or `auth`
- No database clients or storefront feature code in this scaffold ticket

`shared/fixtures` holds deterministic demo users/roles/catalog data.
`data/seed` applies that data to SQL Server (`npm run db:seed` / `db:reset`).
Repository implementations land in later tickets (LCFM-5/6/7).
