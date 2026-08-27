# Docker Compose local stack (Next.js + SQL Server)

This document covers clean-start, seed, and troubleshooting for the LCFM-26
orchestration that runs the production Next.js image next to SQL Server.

## Prerequisites

- Docker Engine + Compose v2
- A local `.env` file (never commit it)

```bash
cp .env.example .env
# Edit MSSQL_SA_PASSWORD and keep both connection-string Password= values in sync.
```

## Clean start

Remove containers and the persisted SQL volume, then rebuild:

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
```

Both `web-next` and `sqlserver` should report `healthy`.

Smoke-check the app health endpoint (does not print secrets):

```bash
curl -sS http://localhost:3000/api/health
# {"status":"ok","service":"web-next","databaseConfigured":true}
```

## Seed existing Catalog / Identity schema

Next.js repositories land in later tickets. Until then, apply the existing EF Core
schema and seed data against the compose SQL Server from a host with the .NET SDK:

```bash
# From repository root; point at published port 1433 on localhost.
export CatalogConnection="Server=localhost,1433;Database=Microsoft.eShopOnWeb.CatalogDb;User Id=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True;"
export IdentityConnection="Server=localhost,1433;Database=Microsoft.eShopOnWeb.Identity;User Id=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True;"

dotnet ef database update -c catalogcontext \
  -p src/Infrastructure/Infrastructure.csproj \
  -s src/Web/Web.csproj \
  --connection "$CatalogConnection"

dotnet ef database update -c appidentitydbcontext \
  -p src/Infrastructure/Infrastructure.csproj \
  -s src/Web/Web.csproj \
  --connection "$IdentityConnection"
```

Starting the legacy .NET `Web` project once against the same SQL instance also
runs the built-in seed (demo catalog items and `demouser@microsoft.com`).

Persisted data lives in the Docker volume `eshop-mssql-data`. A normal
`docker compose down` keeps that volume; `docker compose down -v` wipes it.

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| `sqlserver` never becomes healthy | Confirm `.env` has `MSSQL_SA_PASSWORD` meeting complexity rules (upper, lower, digit, symbol, length ≥ 8). Check `docker compose logs sqlserver`. |
| `web-next` unhealthy / exit | `docker compose logs web-next`. Rebuild with `docker compose build --no-cache web-next`. |
| `databaseConfigured: false` | Ensure `CATALOG_CONNECTION_STRING` and `IDENTITY_CONNECTION_STRING` are set in `.env` and match the SA password. |
| Port 1433 or 3000 already bound | Stop the other process or change the left-hand ports in `docker-compose.override.yml`. |
| Need a fully clean DB | `docker compose down -v` then `up --build -d`, then re-run the seed commands. |

## Image layout

`src/Web.Next/Dockerfile` is multi-stage:

1. `deps` — `npm ci`
2. `builder` — `next build` (standalone output)
3. `runner` — Node Alpine runtime only (no npm SDK / build toolchain)

Secrets are injected at runtime via Compose environment variables, not baked into
the image.
