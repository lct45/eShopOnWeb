# ASP.NET Identity password hash compatibility (LCFM-6)

eShopOnWeb stores credentials in SQL Server `AspNetUsers.PasswordHash` using
ASP.NET Core Identity's default **PasswordHasher V3** format (HMAC-SHA256,
100,000 iterations). The Next.js migration must verify those hashes without
forcing a password reset at cutover.

## Adapter location

| Symbol                            | Module                                                   |
| --------------------------------- | -------------------------------------------------------- |
| `hashPassword` / `verifyPassword` | `src/auth/aspnet-identity-password.ts`                   |
| Credential reads                  | `UserCredentialRepository` in `src/domain/identity`      |
| Implementation                    | `SqlUserCredentialRepository` in `src/data/repositories` |

Auth.js (LCFM-11) should:

1. Look up the user via `UserCredentialRepository.getByNormalizedUserName`
2. Call `verifyPassword(storedHash, submittedPassword)`
3. Never log the hash or return it from route handlers / DTOs

## Wire format (V3)

Base64 of:

1. `0x01` version byte
2. PRF uint32 BE (`1` = HMAC-SHA256)
3. Iteration count uint32 BE
4. Salt length uint32 BE
5. Salt bytes
6. Derived subkey bytes

## Demo seed

`seedDemoIdentity` inserts the same three users and two roles as
`AppIdentityDbContextSeed.cs`, hashing `Pass@word1` with this adapter.
Existing production rows are left untouched; seed skips rows that already
exist by stable fixture IDs.
