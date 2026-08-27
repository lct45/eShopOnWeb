# Module boundaries

This Next.js package keeps migration work parallelizable by isolating concerns
into top-level modules under `src/`.

## Layout

| Module   | Path         | Responsibility                                                                                                               |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `app`    | `src/app`    | Next.js App Router routes, layouts, and UI entry points                                                                      |
| `domain` | `src/domain` | Pure business rules (catalog, basket, order, identity ports)                                                                 |
| `data`   | `src/data`   | Persistence adapters and repository implementations                                                                          |
| `auth`   | `src/auth`   | Identity password compatibility, sessions, and authorization helpers                                                         |
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
- Next.js request handlers must not import `mssql` directly — use `@/data` repositories

## Shared contracts (LCFM-3)

Framework-independent TypeScript DTOs live under `src/shared/contracts/` and role
constants under `src/shared/authorization/`. They mirror PublicApi /
BlazorShared wire shapes (camelCase JSON field names) and must not import React,
Next.js, or database packages.

## Identity persistence (LCFM-6)

- Domain ports: `src/domain/identity`
- SQL implementations: `src/data/repositories/sql-identity-repositories.ts`
- ASP.NET Identity V3 hasher: `src/auth/aspnet-identity-password.ts` (see
  `docs/identity-password-compatibility.md`)
- Demo seed fixtures: `src/shared/fixtures/identity.ts`
