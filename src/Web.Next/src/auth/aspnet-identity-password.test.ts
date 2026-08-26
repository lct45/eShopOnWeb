import { describe, expect, it } from "vitest";
import {
  hashPassword,
  normalizeKey,
  verifyPassword,
} from "@/auth/aspnet-identity-password";

describe("ASP.NET Identity V3 password adapter", () => {
  it("round-trips hash and verify", () => {
    const hash = hashPassword("Pass@word1");
    expect(verifyPassword(hash, "Pass@word1")).toBe(true);
    expect(verifyPassword(hash, "wrong")).toBe(false);
  });

  it("is deterministic for a fixed salt", () => {
    const salt = Buffer.alloc(16, 7);
    const a = hashPassword("Pass@word1", { salt, iterations: 100_000 });
    const b = hashPassword("Pass@word1", { salt, iterations: 100_000 });
    expect(a).toBe(b);
    expect(verifyPassword(a, "Pass@word1")).toBe(true);
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
