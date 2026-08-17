# Web.Next CI quality gates (LCFM-25)

GitHub Actions workflow: [`.github/workflows/web-next.yml`](../../../.github/workflows/web-next.yml).

The existing .NET workflow (`.github/workflows/dotnetcore.yml`) stays enabled until cutover (LCFM-30).

## Local commands (same gates as CI)

From `src/Web.Next`:

```bash
npm ci                 # install from package-lock.json only (no lockfile mutation)
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test:ci        # Vitest + JUnit + coverage
npm run build          # next build
```

Or run the full local mirror of CI:

```bash
npm run verify:ci
```

`npm run verify` remains the lighter developer loop (no coverage/JUnit artifacts).

## Runtime and package manager pins

| Pin     | Location                                | Value        |
| ------- | --------------------------------------- | ------------ |
| Node.js | `.nvmrc`, `package.json` `engines.node` | `22`         |
| npm     | `package.json` `packageManager`         | `npm@10.9.7` |

CI uses `actions/setup-node` with `node-version-file` + `cache: npm` against `package-lock.json`, then **`npm ci`** (never `npm install`) so the lockfile is not rewritten.

## Artifacts visible from the workflow

| Artifact                 | Contents                              |
| ------------------------ | ------------------------------------- |
| `web-next-vitest-junit`  | `reports/junit.xml` unit results      |
| `web-next-coverage`      | `lcov.info` + `coverage-summary.json` |
| `web-next-coverage-html` | Full HTML coverage directory          |

## Pass / fail behavior per gate

On a clean checkout, every gate must exit `0`. Intentionally breaking a gate must exit non-zero and fail the job:

| Gate      | Clean pass                          | Intentional fail example                                |
| --------- | ----------------------------------- | ------------------------------------------------------- |
| Format    | `npm run format:check`              | Introduce bad Prettier spacing in a tracked `.ts` file  |
| Lint      | `npm run lint` (`--max-warnings 0`) | Declare an unused variable (warning becomes CI failure) |
| Typecheck | `npm run typecheck`                 | Assign a `string` to a `number` typed binding           |
| Vitest    | `npm run test:ci`                   | Change an assertion expectation                         |
| Build     | `npm run build`                     | Reference a missing module from a page                  |

Dependency updates for this package are configured in root `.github/dependabot.yml` (`package-ecosystem: npm`, directory `/src/Web.Next`).
