# Module boundaries

This Next.js package keeps migration work parallelizable by isolating concerns
into top-level modules under `src/`.

## Layout

| Module   | Path         | Responsibility                                                                                                               |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `app`    | `src/app`    | Next.js App Router routes, layouts, and UI entry points                                                                      |
| `domain` | `src/domain` | Pure business rules (catalog ports/types; basket/order later)                                                                |
| `data`   | `src/data`   | Persistence adapters and repository implementations (catalog SQL in LCFM-5)                                                  |
| `auth`   | `src/auth`   | Identity, sessions, and authorization helpers                                                                                |
| `shared` | `src/shared` | Cross-cutting types and utilities with no feature logic (includes `contracts/` API DTOs and `authorization/` role constants) |

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
- No storefront feature UI in the data/domain modules

## Shared contracts (LCFM-3)

Framework-independent TypeScript DTOs live under `src/shared/contracts/` and role
constants under `src/shared/authorization/`. They mirror PublicApi /
BlazorShared wire shapes (camelCase JSON field names) and must not import React,
Next.js, or database packages.

## Catalog SQL (LCFM-5)

Catalog SQL lives under `src/data` and `src/domain/catalog`.
Basket/order persistence is a separate ticket (LCFM-7).

Later tickets fill remaining modules; foundation tickets establish contracts and
the executable toolchain.
