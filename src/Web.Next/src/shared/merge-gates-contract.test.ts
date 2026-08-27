import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, accessSync, constants } from "node:fs";
import { resolve } from "node:path";

const webNextRoot = resolve(__dirname, "../..");
const repoRoot = resolve(webNextRoot, "../..");

const REQUIRED_CONTEXTS = [
  "build",
  "Format, lint, typecheck, test, build",
  "Cursor Bugbot",
] as const;

describe("main merge gates contract (LCFM-36)", () => {
  const rulesetPath = resolve(
    repoRoot,
    ".github/rulesets/main-merge-gates.json",
  );
  const applyScriptPath = resolve(
    repoRoot,
    "scripts/apply-main-merge-gates.sh",
  );
  const stageGatesPath = resolve(repoRoot, "docs/migration-stage-gates.md");
  const webNextWorkflowPath = resolve(
    repoRoot,
    ".github/workflows/web-next.yml",
  );
  const dotnetWorkflowPath = resolve(
    repoRoot,
    ".github/workflows/dotnetcore.yml",
  );

  it("encodes required status checks for main in the ruleset JSON", () => {
    expect(existsSync(rulesetPath)).toBe(true);

    const ruleset = JSON.parse(readFileSync(rulesetPath, "utf8")) as {
      name: string;
      target: string;
      enforcement: string;
      conditions: { ref_name: { include: string[] } };
      rules: Array<{
        type: string;
        parameters?: {
          required_status_checks?: Array<{ context: string }>;
        };
      }>;
    };

    expect(ruleset.name).toBe("main merge gates (LCFM-36)");
    expect(ruleset.target).toBe("branch");
    expect(ruleset.enforcement).toBe("active");
    expect(ruleset.conditions.ref_name.include).toContain("refs/heads/main");

    const statusRule = ruleset.rules.find(
      (rule) => rule.type === "required_status_checks",
    );
    expect(statusRule).toBeDefined();

    const contexts =
      statusRule?.parameters?.required_status_checks?.map(
        (check) => check.context,
      ) ?? [];

    for (const context of REQUIRED_CONTEXTS) {
      expect(contexts).toContain(context);
    }

    // Playwright E2E is a documented follow-up, not a current required check.
    expect(contexts.some((context) => /playwright/i.test(context))).toBe(false);
  });

  it("ships an executable apply script that targets the ruleset file", () => {
    expect(existsSync(applyScriptPath)).toBe(true);
    accessSync(applyScriptPath, constants.X_OK);

    const script = readFileSync(applyScriptPath, "utf8");
    expect(script).toContain("main-merge-gates.json");
    expect(script).toContain("main merge gates (LCFM-36)");
    expect(script).toContain("repos/${REPO}/rulesets");
  });

  it("documents required checks and cutover updates in stage gates", () => {
    const doc = readFileSync(stageGatesPath, "utf8");

    expect(doc).toContain("Required merge checks on `main` (LCFM-36)");
    for (const context of REQUIRED_CONTEXTS) {
      expect(doc).toContain(`\`${context}\``);
    }
    expect(doc).toContain("Cutover update checklist (LCFM-30)");
    expect(doc).toContain("LCFM-28");
    expect(doc).toContain(".github/rulesets/main-merge-gates.json");
    expect(doc).toContain("scripts/apply-main-merge-gates.sh");
  });

  it("keeps Web.Next CI always reporting so required checks can pass", () => {
    const workflow = readFileSync(webNextWorkflowPath, "utf8");

    expect(workflow).toContain("name: Format, lint, typecheck, test, build");
    expect(workflow).toMatch(/^on:\n(?:.*\n)*? {2}pull_request:\n/m);

    // Path filters on pull_request would skip the required check.
    expect(workflow).not.toMatch(/pull_request:\n(?: {4}.+\n)*? {4}paths:/m);
  });

  it("keeps the .NET workflow until cutover so `build` remains available", () => {
    expect(existsSync(dotnetWorkflowPath)).toBe(true);
    const workflow = readFileSync(dotnetWorkflowPath, "utf8");
    expect(workflow).toMatch(/^\s{2}build:\s*$/m);
  });
});
