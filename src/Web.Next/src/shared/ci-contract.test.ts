import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const webNextRoot = resolve(__dirname, "../..");
const repoRoot = resolve(webNextRoot, "../..");

describe("Web.Next CI contract (LCFM-25)", () => {
  it("pins Node and npm for reproducible CI installs", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(webNextRoot, "package.json"), "utf8"),
    ) as {
      engines?: { node?: string };
      packageManager?: string;
    };
    const nvmrc = readFileSync(resolve(webNextRoot, ".nvmrc"), "utf8").trim();

    expect(nvmrc).toBe("22");
    expect(packageJson.engines?.node).toBe(">=22 <23");
    expect(packageJson.packageManager).toBe("npm@10.9.7");
    expect(existsSync(resolve(webNextRoot, "package-lock.json"))).toBe(true);
  });

  it("defines a CI workflow that uses the lockfile and uploads test reports", () => {
    const workflowPath = resolve(repoRoot, ".github/workflows/web-next.yml");
    expect(existsSync(workflowPath)).toBe(true);

    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain("node-version-file: src/Web.Next/.nvmrc");
    expect(workflow).toContain("cache: npm");
    expect(workflow).toContain(
      "cache-dependency-path: src/Web.Next/package-lock.json",
    );
    expect(workflow).toContain("npm ci");
    expect(workflow).not.toMatch(/^\s*run:\s*npm install\b/m);
    expect(workflow).toContain("npm run format:check");
    expect(workflow).toContain("npm run lint");
    expect(workflow).toContain("npm run typecheck");
    expect(workflow).toContain("npm run test:ci");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("web-next-vitest-junit");
    expect(workflow).toContain("web-next-coverage");
    expect(workflow).toContain("reports/junit.xml");
  });

  it("keeps the .NET CI workflow alongside Web.Next CI", () => {
    expect(
      existsSync(resolve(repoRoot, ".github/workflows/dotnetcore.yml")),
    ).toBe(true);
    expect(
      existsSync(resolve(repoRoot, ".github/workflows/web-next.yml")),
    ).toBe(true);
  });

  it("configures Dependabot for the Node ecosystem under src/Web.Next", () => {
    const dependabot = readFileSync(
      resolve(repoRoot, ".github/dependabot.yml"),
      "utf8",
    );

    expect(dependabot).toContain('package-ecosystem: "npm"');
    expect(dependabot).toContain('directory: "/src/Web.Next"');
    expect(dependabot).toContain('package-ecosystem: "nuget"');
  });

  it("documents local commands that match CI gates", () => {
    const ciDocs = readFileSync(resolve(webNextRoot, "docs/ci.md"), "utf8");

    for (const command of [
      "npm ci",
      "npm run format:check",
      "npm run lint",
      "npm run typecheck",
      "npm run test:ci",
      "npm run build",
      "npm run verify:ci",
    ]) {
      expect(ciDocs).toContain(command);
    }
  });
});
