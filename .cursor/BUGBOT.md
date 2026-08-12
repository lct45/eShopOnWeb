# Bugbot rules — eShopOnWeb Next.js migration

These rules apply to every pull request. Bugbot reviews the diff; it does not run tests. CI must still pass. Stage exit criteria live in `docs/migration-stage-gates.md`.

## Require an LCFM ticket

If the PR changes application, test, CI, deployment, or migration-docs files and the title or description has no `LCFM-` key, flag it as blocking. Ask the author to link the Jira ticket this PR implements.

## Tests must land with behavior

If production code changes under `app/`, `domain/`, `data/`, `auth/`, or `shared/` and the PR does not also change tests (`**/*.{test,spec}.{ts,tsx}`, `tests/**`, or Playwright files), flag it as blocking. Ask for the tests that cover the new behavior.

Do not flag pure docs, Bugbot rules, or PR-template-only changes.

## Do not weaken security

If the diff removes or bypasses authentication, CSRF/origin checks, role guards, session-cookie flags (`httpOnly`, `secure`, `sameSite`), or authorization assertions, flag it as blocking unless the PR proves equivalent protection and links an LCFM security ticket.

If credentials, password hashes, recovery codes, JWT secrets, or connection strings are logged or returned in API/UI payloads, flag it as blocking.

## Preserve user-visible parity strings

If storefront or Playwright-facing copy changes any of the following without an explicit contract-change note, flag it:

- `[ ADD TO BASKET ]`
- `Basket`
- `Basket is empty`
- `Thanks for your Order!`
- `.NET Bot Black Sweatshirt`
- `.NET Black & White Mug`
- title suffix `- Microsoft.eShopOnWeb`
- demo users `demouser@microsoft.com`, `admin@microsoft.com`, `productmgr@microsoft.com`

## No secrets in source

If committed files contain live passwords, API keys, JWT signing keys, or connection strings (except the documented demo password `Pass@word1` in tests/seed docs), flag it as blocking and demand removal plus rotation notes.

## No destructive schema changes before PostgreSQL follow-up

Until LCFM-31/LCFM-32/LCFM-33, if the PR adds `DROP TABLE`, column drops, or a PostgreSQL provider/schema switch, flag it as blocking. SQL Server remains the source of truth through cutover (LCFM-30).

## API and admin authorization

If files under `app/api/**` change write endpoints (POST/PUT/PATCH/DELETE) without tests for unauthorized, wrong-role, and allowed-role cases, flag it as blocking.

If catalog write routes omit Product Manager checks, or user/role routes omit Administrator checks, flag it as blocking.

If admin UI under `app/(admin)/**` or `app/admin/**` is reachable without a server-side role check, flag it as blocking.

## PR evidence

If the PR implements a feature or API ticket (LCFM-12 through LCFM-24) and the description is missing the stage gate, tests added, or validation evidence sections from `.github/pull_request_template.md`, flag it. Ask the author to fill them in.
