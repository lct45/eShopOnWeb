import { describe, expect, it } from "vitest";
import { RoleCombinations, Roles } from "@/shared/authorization/constants";

describe("authorization role constants", () => {
  it("matches BlazorShared Administrators and Product Managers values", () => {
    expect(Roles.ADMINISTRATORS).toBe("Administrators");
    expect(Roles.PRODUCT_MANAGERS).toBe("Product Managers");
    expect(RoleCombinations.ADMIN_PORTAL_ROLES).toBe(
      "Administrators,Product Managers",
    );
  });

  it("exposes only the known portal roles", () => {
    expect(Object.values(Roles)).toEqual([
      "Administrators",
      "Product Managers",
    ]);
  });
});
