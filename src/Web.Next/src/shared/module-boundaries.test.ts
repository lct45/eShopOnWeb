import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("module boundary documentation", () => {
  it("documents app, domain, data, auth, and shared aliases", () => {
    const modulesPath = resolve(__dirname, "../../MODULES.md");
    expect(existsSync(modulesPath)).toBe(true);

    const content = readFileSync(modulesPath, "utf8");
    for (const moduleName of ["app", "domain", "data", "auth", "shared"]) {
      expect(content).toContain(`@/${moduleName}/*`);
      expect(existsSync(resolve(__dirname, `../${moduleName}`))).toBe(true);
    }
  });
});
