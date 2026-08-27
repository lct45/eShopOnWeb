import { describe, expect, it } from "vitest";
import {
  assertNoSensitiveIdentityFields,
  toRolePublicDto,
  toUserPublicDto,
  type ApplicationRole,
  type ApplicationUser,
} from "@/domain/identity/types";

const sampleUser: ApplicationUser = {
  id: "u1",
  userName: "demouser@microsoft.com",
  normalizedUserName: "DEMOUSER@MICROSOFT.COM",
  email: "demouser@microsoft.com",
  normalizedEmail: "DEMOUSER@MICROSOFT.COM",
  emailConfirmed: true,
  phoneNumber: null,
  phoneNumberConfirmed: false,
  twoFactorEnabled: false,
  lockoutEnd: null,
  lockoutEnabled: true,
  accessFailedCount: 0,
  concurrencyStamp: "stamp",
};

describe("identity public DTOs", () => {
  it("strips sensitive fields from user DTOs", () => {
    const dto = toUserPublicDto(sampleUser);
    expect(dto.userName).toBe("demouser@microsoft.com");
    assertNoSensitiveIdentityFields(dto as unknown as Record<string, unknown>);
    expect("passwordHash" in dto).toBe(false);
    expect("securityStamp" in dto).toBe(false);
    expect("concurrencyStamp" in dto).toBe(false);
  });

  it("maps roles to public DTOs", () => {
    const role: ApplicationRole = {
      id: "r1",
      name: "Administrators",
      normalizedName: "ADMINISTRATORS",
      concurrencyStamp: "c",
    };
    expect(toRolePublicDto(role)).toEqual({
      id: "r1",
      name: "Administrators",
    });
  });

  it("rejects DTOs that leak password hashes", () => {
    expect(() =>
      assertNoSensitiveIdentityFields({
        id: "x",
        passwordHash: "secret",
      }),
    ).toThrow(/passwordHash/);
  });
});
