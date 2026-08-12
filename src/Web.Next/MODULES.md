# Module boundaries

This Next.js package keeps migration work parallelizable by isolating concerns
into top-level modules under `src/`.

## Layout

| Module   | Path         | Responsibility                                          |
| -------- | ------------ | ------------------------------------------------------- |
| `app`    | `src/app`    | Next.js App Router routes, layouts, and UI entry points |
| `domain` | `src/domain` | Pure business rules (catalog, basket, order)            |
| `data`   | `src/data`   | Persistence adapters and repository implementations     |
| `auth`   | `src/auth`   | Identity, sessions, and authorization helpers           |
| `shared` | `src/shared` | Cross-cutting types and utilities with no feature logic |

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

Later tickets fill these modules; this ticket only establishes the empty
boundaries and executable toolchain.
