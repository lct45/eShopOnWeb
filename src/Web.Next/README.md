# Next.js scaffold for eShopOnWeb (LCFM-2 / LCFM-26)

Minimal App Router foundation. Storefront UI and repositories arrive in later
tickets. Container orchestration for this app is documented in
[docs/docker-local-nextjs.md](../../docs/docker-local-nextjs.md).

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

## Docker (production image + SQL Server)

```bash
# From repository root
cp .env.example .env   # set MSSQL_SA_PASSWORD and connection strings
docker compose up --build -d
curl -sS http://localhost:3000/api/health
```

## Module boundaries

See [MODULES.md](./MODULES.md) for import aliases and dependency rules.
