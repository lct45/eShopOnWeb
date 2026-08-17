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
    expect(packageJson.scripts["test:ci"]).toContain("vitest run");
    expect(packageJson.scripts["test:ci"]).toContain("--coverage");
    expect(packageJson.scripts["test:ci"]).toContain("junit");
    expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");
    expect(packageJson.scripts.lint).toBe("eslint . --max-warnings 0");
    expect(packageJson.scripts["format:check"]).toBe("prettier --check .");
    expect(packageJson.scripts["verify:ci"]).toContain("test:ci");
    expect(packageJson.scripts["db:seed"]).toBe(
      "tsx src/data/seed/cli.ts seed",
    );
    expect(packageJson.scripts["db:reset"]).toBe(
      "tsx src/data/seed/cli.ts reset",
  });
});
