import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./identity-password";
import { DEMO_PASSWORD } from "@/shared/fixtures";

describe("ASP.NET Identity V3 password hasher", () => {
  it("round-trips the demo password without storing a committed hash", () => {
    const hash = hashPassword(DEMO_PASSWORD);
    expect(hash.startsWith("AQAAAA")).toBe(true);
    expect(verifyPassword(hash, DEMO_PASSWORD)).toBe(true);
    expect(verifyPassword(hash, "badpassword")).toBe(false);
  });

  it("is deterministic for a fixed salt (useful for differential tests)", () => {
    const salt = Buffer.alloc(16, 7);
    const a = hashPassword(DEMO_PASSWORD, { salt, iterations: 100_000 });
    const b = hashPassword(DEMO_PASSWORD, { salt, iterations: 100_000 });
    expect(a).toBe(b);
  });
});
