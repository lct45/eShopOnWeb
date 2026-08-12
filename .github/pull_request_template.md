## LCFM ticket

- Ticket: LCFM-
- Stage gate (see `docs/migration-stage-gates.md`):
- Blocks / unblocks:

## Summary

<!-- What changed and why. -->

## Tests added or updated

- [ ] Unit / Vitest
- [ ] SQL Server integration
- [ ] API contract or differential
- [ ] Playwright / visual
- [ ] Not applicable (docs or rules only)

## Validation evidence

<!-- Commands run, screenshots, traces, or links to CI jobs. -->

## Parity and security

- [ ] User-visible strings and locators used by Playwright are unchanged, or the contract change is called out above
- [ ] Auth, CSRF, and role checks are not weakened
- [ ] No secrets, connection strings, or password hashes in the diff
- [ ] No destructive SQL Server schema changes (PostgreSQL work belongs in LCFM-31+)

## Stage exit

- [ ] This PR meets the exit criteria for its stage in `docs/migration-stage-gates.md`
