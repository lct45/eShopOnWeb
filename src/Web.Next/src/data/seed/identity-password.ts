import {
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * ASP.NET Core Identity PasswordHasher V3 format.
 * Compatible with Microsoft.AspNetCore.Identity default hasher (HMAC-SHA256).
 *
 * Layout (base64): version(1) | prf(4 BE) | iter(4 BE) | saltLen(4 BE) | salt | subkey
 */
const VERSION = 0x01;
const PRF_HMAC_SHA256 = 1;
const DEFAULT_ITERATIONS = 100_000;
const SALT_SIZE = 16;
const SUBKEY_SIZE = 32;

function writeUInt32BE(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

export function hashPassword(
  password: string,
  options?: { iterations?: number; salt?: Buffer },
): string {
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  const salt = options?.salt ?? randomBytes(SALT_SIZE);
  const subkey = pbkdf2Sync(password, salt, iterations, SUBKEY_SIZE, "sha256");

  const payload = Buffer.concat([
    Buffer.from([VERSION]),
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
  if (decoded.length < 13 || decoded[0] !== VERSION) {
    return false;
  }

  const iterations = decoded.readUInt32BE(5);
  const saltLength = decoded.readUInt32BE(9);
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

export function normalizeKey(value: string): string {
  return value.toUpperCase();
}

export function newSecurityStamp(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}
