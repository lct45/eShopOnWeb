import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("package scripts", () => {
  it("exposes production build and quality gates", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.build).toBe("next build");
    expect(packageJson.scripts.test).toBe("vitest run");
    expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");
    expect(packageJson.scripts.lint).toBe("eslint .");
    expect(packageJson.scripts["format:check"]).toBe("prettier --check .");
  });
});
