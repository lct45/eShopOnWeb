# Bugbot rules — auth

These rules apply when reviewing files under `auth/`.

## Require security tests with auth changes

If session, password, role, CSRF, or OAuth code changes without tests covering success, unauthorized, and forbidden cases, flag it as blocking.

## Protect cookies and tokens

If session cookies are set without `httpOnly`, or without `secure` outside local development, flag it as blocking.

If JWT secrets or Identity hashes are hardcoded in client bundles or public env vars, flag it as blocking.

## Preserve demo-user compatibility

If the PR breaks sign-in for `demouser@microsoft.com`, `admin@microsoft.com`, or `productmgr@microsoft.com` against existing ASP.NET Identity hashes without a documented one-time upgrade path and tests, flag it as blocking.

## No account enumeration

If login or registration error messages distinguish “unknown user” from “wrong password”, flag it. Use a generic credential error.
