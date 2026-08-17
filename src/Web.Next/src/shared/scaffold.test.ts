import { describe, expect, it } from "vitest";
import { getScaffoldStatus, SCAFFOLD_NAME } from "@/shared/scaffold";

describe("Next.js scaffold smoke", () => {
  it("reports the foundation modules as ready", () => {
    const status = getScaffoldStatus();

    expect(status.name).toBe(SCAFFOLD_NAME);
    expect(status.ready).toBe(true);
    expect(status.modules).toEqual(["app", "domain", "data", "auth", "shared"]);
  });
});
