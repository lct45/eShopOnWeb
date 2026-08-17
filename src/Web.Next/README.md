# Next.js scaffold for eShopOnWeb (LCFM-2)

Minimal App Router foundation only. No storefront UI, auth flows, or database
integration in this package yet.

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

## Module boundaries

See [MODULES.md](./MODULES.md) for import aliases and dependency rules.
