# Bugbot rules — data

These rules apply when reviewing files under `data/`.

## Stay on SQL Server until follow-up tickets

If the PR introduces a PostgreSQL provider, `postgres` URL, or schema rewrite before LCFM-31, flag it as blocking.

If the PR includes `DROP TABLE`, `DROP COLUMN`, or other destructive DDL against catalog or identity databases, flag it as blocking.

## Require integration tests for persistence changes

If repository, model, or migration files change and the PR has no SQL Server integration test updates, flag it as blocking.

## Do not leak persistence into domain or HTTP layers

If repository implementations are imported directly from `app/` route handlers instead of through domain services/interfaces, flag it. Ask to keep ORM types inside `data/`.

## Never log connection strings

If connection strings, SQL logins, or raw parameterized secrets appear in logs or error messages, flag it as blocking.
