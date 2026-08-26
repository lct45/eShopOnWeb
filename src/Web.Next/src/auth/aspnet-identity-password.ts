import {
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * ASP.NET Core Identity PasswordHasher **V3** compatibility adapter.
 *
 * Compatible with `Microsoft.AspNetCore.Identity.PasswordHasher<TUser>` defaults
 * (PRF = HMAC-SHA256, 100_000 iterations). Existing SQL Server `AspNetUsers.PasswordHash`
 * values produced by eShopOnWeb can be verified without re-hashing at cutover.
 *
 * Wire format (base64 of binary payload):
 * ```
 * version (1 byte) = 0x01
 * prf     (4 bytes BE) = 1 (HMAC-SHA256)
 * iter    (4 bytes BE)
 * saltLen (4 bytes BE)
 * salt    (saltLen bytes)
 * subkey  (remaining bytes)
 * ```
 *
 * Auth.js credentials (LCFM-11) should call `verifyPassword` against the hash
 * returned by `UserCredentialRepository` — never log or return the hash.
 *
 * @see https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.identity.passwordhasher-1
 */

const VERSION_V3 = 0x01;
const PRF_HMAC_SHA256 = 1;
const DEFAULT_ITERATIONS = 100_000;
const SALT_SIZE = 16;
const SUBKEY_SIZE = 32;

function writeUInt32BE(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

export type HashPasswordOptions = {
  iterations?: number;
  salt?: Buffer;
};

export function hashPassword(
  password: string,
  options?: HashPasswordOptions,
): string {
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  const salt = options?.salt ?? randomBytes(SALT_SIZE);
  const subkey = pbkdf2Sync(password, salt, iterations, SUBKEY_SIZE, "sha256");

  const payload = Buffer.concat([
    Buffer.from([VERSION_V3]),
    writeUInt32BE(PRF_HMAC_SHA256),
    writeUInt32BE(iterations),
    writeUInt32BE(salt.length),
    salt,
    subkey,
  ]);

  return payload.toString("base64");
}

export function verifyPassword(
  hashedPassword: string,
  password: string,
): boolean {
  const decoded = Buffer.from(hashedPassword, "base64");
  if (decoded.length < 13 || decoded[0] !== VERSION_V3) {
    return false;
  }

  const iterations = decoded.readUInt32BE(5);
  const saltLength = decoded.readUInt32BE(9);
  if (saltLength < 0 || 13 + saltLength > decoded.length) {
    return false;
  }

  const salt = decoded.subarray(13, 13 + saltLength);
  const expected = decoded.subarray(13 + saltLength);
  const actual = pbkdf2Sync(
    password,
    salt,
    iterations,
    expected.length,
    "sha256",
  );

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

/** ASP.NET Identity normalizes user names / emails with ToUpperInvariant. */
export function normalizeKey(value: string): string {
  return value.toUpperCase();
}

export function newSecurityStamp(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

export function newConcurrencyStamp(): string {
  return randomBytes(16).toString("hex");
}
