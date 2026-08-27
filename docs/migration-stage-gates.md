# Migration stage exit gates

Use these gates to decide whether an LCFM ticket is actually done. Implementation without the listed evidence is not done.

Migration plan and ticket map: [dotnet-to-nextjs-migration.md](./dotnet-to-nextjs-migration.md)

Bugbot reviews diffs only. Required CI (LCFM-36) is what blocks merge when tests fail.

## Required merge checks on `main` (LCFM-36)

These GitHub status-check **contexts** must pass before a PR can merge to `main`. Source of truth for the ruleset payload: [`.github/rulesets/main-merge-gates.json`](../.github/rulesets/main-merge-gates.json). Apply or refresh with [`scripts/apply-main-merge-gates.sh`](../scripts/apply-main-merge-gates.sh) (repo **admin** token).

| Required check context | Source | When |
| --- | --- | --- |
| `build` | `.github/workflows/dotnetcore.yml` (.NET job) | Required until cutover ([LCFM-30](https://fe-anysphere-demo.atlassian.net/browse/LCFM-30)) |
| `Format, lint, typecheck, test, build` | `.github/workflows/web-next.yml` (Web.Next quality job) | Required now ([LCFM-25](https://fe-anysphere-demo.atlassian.net/browse/LCFM-25)) — format, lint, typecheck, Vitest, `next build` |
| `Cursor Bugbot` | Cursor Bugbot GitHub check | Required now ([LCFM-35](https://fe-anysphere-demo.atlassian.net/browse/LCFM-35)) |

**Not required yet**

| Check | Reason |
| --- | --- |
| Next.js Playwright / E2E parity job | Add as a required context after [LCFM-28](https://fe-anysphere-demo.atlassian.net/browse/LCFM-28) ships the workflow; then update the ruleset JSON and re-run the apply script |

### Why Web.Next CI has no path filters

Required checks that are skipped (for example by `paths:` filters) never report a status, so GitHub blocks the PR forever. `web-next.yml` therefore runs on every pull request and every push to `main`.

### Cutover update checklist (LCFM-30)

When removing the .NET solution:

1. Delete or stop requiring `.github/workflows/dotnetcore.yml`.
2. Remove the `build` context from `.github/rulesets/main-merge-gates.json`.
3. Keep `Format, lint, typecheck, test, build` and `Cursor Bugbot`.
4. If Playwright parity CI exists, append that job’s context name to `required_status_checks`.
5. Re-run `scripts/apply-main-merge-gates.sh` and confirm Settings → Rules on the repo.

### Enforcement acceptance (what “required” means)

- A PR whose lint, typecheck, unit tests, or production build fails cannot merge to `main`.
- A PR with no successful `Cursor Bugbot` check cannot merge to `main`.
- .NET `build` remains required until the cutover checklist above is executed.

## How to use this on a PR

1. Link the `LCFM-*` ticket.
2. Name the stage below.
3. Attach the evidence for that stage.
4. Do not close a ticket that still has open `blocks` links to unfinished validation work.

## Gate 0 — Quality tooling

**Tickets:** [LCFM-34](https://fe-anysphere-demo.atlassian.net/browse/LCFM-34), [LCFM-35](https://fe-anysphere-demo.atlassian.net/browse/LCFM-35), [LCFM-36](https://fe-anysphere-demo.atlassian.net/browse/LCFM-36), [LCFM-37](https://fe-anysphere-demo.atlassian.net/browse/LCFM-37)

**Pass when:**

- Root and nested `.cursor/BUGBOT.md` files exist
- `.github/pull_request_template.md` pre-fills on new PRs
- This document is linked from the template and Bugbot rules
- Required merge checks for `main` are listed above and encoded in `.github/rulesets/main-merge-gates.json`

## Gate 1 — Foundation

**Tickets:** LCFM-2, LCFM-3, LCFM-4, LCFM-25, LCFM-26

**Pass when:**

- `next build`, lint, typecheck, and Vitest pass on a clean checkout
- Shared DTOs compile and serialize with current PublicApi field names
- Shell renders with ported assets and the `- Microsoft.eShopOnWeb` title suffix
- Next.js CI workflow exists (LCFM-25)
- Compose boots Next.js + SQL Server without committed secrets (LCFM-26)

**Can start in parallel with Gate 1:** LCFM-41 (.NET parity baseline)

## Gate 2 — Data and domain

**Tickets:** LCFM-5, LCFM-6, LCFM-7, LCFM-8, LCFM-9, LCFM-10, LCFM-42, LCFM-43

**Pass when:**

- Repositories read the existing SQL Server schema without destructive migrations
- Shared seed recreates demo users, roles, and 12 catalog items
- Domain tests cover catalog paging (10 / page), basket totals (`$416.50` for qty 49 of item 2), and qty 0 removal
- SQL Server compatibility tests pass (LCFM-43)

## Gate 3 — Auth

**Tickets:** LCFM-11, LCFM-38

**Pass when:**

- Demo user, admin, and product-manager credentials authenticate
- Role guards have positive and negative tests
- Session cookies are `httpOnly` (and `secure` outside local dev)
- Auth compatibility suite passes (LCFM-38)

## Gate 4 — Storefront features

**Tickets:** LCFM-12 through LCFM-20

**Pass when each ticket has:**

- Tests listed in that ticket's acceptance criteria
- Playwright-visible strings preserved
- Authz behavior unchanged (anonymous checkout redirects; orders are owner-scoped)

**Cross-ticket validation:** LCFM-28 (E2E), LCFM-44 (visual)

## Gate 5 — API and admin

**Tickets:** LCFM-21, LCFM-22, LCFM-23, LCFM-24, LCFM-39

**Pass when:**

- Ported PublicApi tests pass against Next.js
- Catalog writes require Product Managers; user/role writes require Administrators
- Differential harness (LCFM-39) shows no unexplained contract drift
- Admin browser tests pass without Blazor or PublicApi

## Gate 6 — Platform

**Tickets:** LCFM-25, LCFM-26, LCFM-27, LCFM-29, LCFM-36, LCFM-40

**Pass when:**

- Required CI checks block merge (LCFM-36): `build`, `Format, lint, typecheck, test, build`, and `Cursor Bugbot` are documented and applied via the main ruleset (see [Required merge checks on main](#required-merge-checks-on-main-lcfm-36))
- Health: liveness stays up if SQL is down; readiness fails
- Azure non-prod deployment boots against existing SQL Server
- Performance job has a recorded .NET baseline and Next.js thresholds (LCFM-40)

## Gate 7 — Cutover

**Tickets:** LCFM-28, LCFM-30

**Pass when:**

- Full Playwright parity suite is green on seeded SQL Server
- Visual and performance jobs are green or waived in writing
- Rollback was rehearsed
- No .NET runtime/build/deploy dependency remains
- SQL Server is still the database (Postgres is LCFM-31+)

## Gate 8 — PostgreSQL follow-up

**Tickets:** LCFM-31, LCFM-32, LCFM-33

**Pass when:**

- Schema mapping is complete
- Migration tooling validates counts and relationships on a rehearsal snapshot
- Production cutover has tested backups, a rollback window, and then SQL Server retirement

## Ticket to gate map

| Tickets | Gate |
| --- | --- |
| LCFM-34, LCFM-35, LCFM-36, LCFM-37 | 0 Quality tooling / merge gates |
| LCFM-2–4, LCFM-25, LCFM-26 | 1 Foundation |
| LCFM-5–10, LCFM-42, LCFM-43 | 2 Data and domain |
| LCFM-11, LCFM-38 | 3 Auth |
| LCFM-12–20 | 4 Storefront |
| LCFM-21–24, LCFM-39 | 5 API and admin |
| LCFM-27, LCFM-29, LCFM-36, LCFM-40 | 6 Platform |
| LCFM-28, LCFM-30 | 7 Cutover |
| LCFM-31–33 | 8 PostgreSQL |
| LCFM-41, LCFM-44 | Baselines used by gates 4–7 |

## What Bugbot vs CI vs humans do

| Check | Who |
| --- | --- |
| Ticket linked, tests present in the diff, no secrets, no weakened auth | Bugbot (LCFM-35) |
| Lint, typecheck, unit, integration, Playwright actually pass | CI (LCFM-25, LCFM-36) |
| Stage evidence is sufficient to close the ticket | Reviewer using this doc |

See also [Required merge checks on `main`](#required-merge-checks-on-main-lcfm-36) for the exact GitHub check contexts that block merge.
