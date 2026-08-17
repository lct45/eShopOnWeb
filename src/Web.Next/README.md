# Next.js app for eShopOnWeb (`src/Web.Next`)

App Router foundation for the .NET → Next.js migration. LCFM-4 adds the shared
visual shell and static asset pipeline on top of the LCFM-2 scaffold.

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

## Shell and assets

- Root layout wraps pages in `AppShell` (header nav slots, footer, responsive containers).
- Page titles use the `%s - Microsoft.eShopOnWeb` metadata template.
- Brand, product images, Montserrat fonts, and favicon live under `public/`.
- Shared styles are imported from `src/styles/` (ported from `src/Web/wwwroot`).
- Reusable `LoadingState`, `EmptyState`, and `ErrorState` live in `src/shared/ui`.

## Module boundaries

See [MODULES.md](./MODULES.md) for import aliases and dependency rules.
