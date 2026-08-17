# Next.js scaffold for eShopOnWeb (LCFM-2)

Minimal App Router foundation only. No storefront UI, auth flows, or database
integration in this package yet.

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
