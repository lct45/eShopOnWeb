import { pbkdf2Sync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hashPassword,
  normalizeKey,
  verifyPassword,
} from "@/auth/aspnet-identity-password";

function writeUInt32BE(value: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

function v3Payload(
  password: string,
  prfId: number,
  digest: string,
  iterations: number,
): string {
  const salt = Buffer.alloc(16, 7);
  const subkey = pbkdf2Sync(password, salt, iterations, 32, digest);
  return Buffer.concat([
    Buffer.from([0x01]),
    writeUInt32BE(prfId),
    writeUInt32BE(iterations),
    writeUInt32BE(salt.length),
    salt,
    subkey,
  ]).toString("base64");
}

describe("ASP.NET Identity V3 password adapter", () => {
  it("round-trips hash and verify", () => {
    const hash = hashPassword("Pass@word1");
    expect(verifyPassword(hash, "Pass@word1")).toBe(true);
    expect(verifyPassword(hash, "wrong")).toBe(false);
  });

  it("writes HMAC-SHA512 (PRF 2) at Identity V3 defaults", () => {
    const salt = Buffer.alloc(16, 7);
    const hash = hashPassword("Pass@word1", { salt, iterations: 100_000 });
    const decoded = Buffer.from(hash, "base64");
    expect(decoded[0]).toBe(0x01);
    expect(decoded.readUInt32BE(1)).toBe(2);
    expect(decoded.readUInt32BE(5)).toBe(100_000);
    expect(verifyPassword(hash, "Pass@word1")).toBe(true);
  });

  it("is deterministic for a fixed salt", () => {
    const salt = Buffer.alloc(16, 7);
    const a = hashPassword("Pass@word1", { salt, iterations: 100_000 });
    const b = hashPassword("Pass@word1", { salt, iterations: 100_000 });
    expect(a).toBe(b);
    expect(verifyPassword(a, "Pass@word1")).toBe(true);
  });

  it("verifies stored PRF rather than assuming SHA256", () => {
    const sha512 = v3Payload("Pass@word1", 2, "sha512", 100_000);
    const sha256 = v3Payload("Pass@word1", 1, "sha256", 10_000);
    expect(verifyPassword(sha512, "Pass@word1")).toBe(true);
    expect(verifyPassword(sha256, "Pass@word1")).toBe(true);
    expect(verifyPassword(sha512, "wrong")).toBe(false);
  });

  it("rejects non-V3 payloads", () => {
    expect(verifyPassword("not-base64-identity", "Pass@word1")).toBe(false);
    const v2 = Buffer.from([0x00, 0x01]).toString("base64");
    expect(verifyPassword(v2, "Pass@word1")).toBe(false);
  });

  it("normalizes keys like ASP.NET Identity", () => {
    expect(normalizeKey("Admin@Microsoft.com")).toBe("ADMIN@MICROSOFT.COM");
  });
});
