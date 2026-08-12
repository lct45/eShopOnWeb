# Bugbot rules — domain

These rules apply when reviewing files under `domain/`.

## Keep domain framework-free

If `domain/` files import `next`, `react`, `next-auth`, `next/headers`, Prisma, Drizzle, or other HTTP/UI/ORM packages, flag it as blocking. Domain code must depend only on TypeScript types and injected repository interfaces.

## Require Vitest with behavior changes

If domain entities, specifications, or services change and the PR does not update a colocated or `domain/**` Vitest file, flag it as blocking.

## Preserve pricing and quantity rules

If basket total, quantity-zero removal, or catalog page-size logic changes without a test proving parity with the .NET rules (10 items per page; qty 49 of item 2 totals `$416.50`; qty 0 removes the line), flag it as blocking.
