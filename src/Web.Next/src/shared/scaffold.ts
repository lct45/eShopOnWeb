/**
 * Minimal scaffold marker used by smoke tests.
 * No storefront or persistence behavior lives here.
 */
export const SCAFFOLD_NAME = "eShopOnWeb Next.js";

export function getScaffoldStatus(): {
  name: string;
  ready: boolean;
  modules: readonly string[];
} {
  return {
    name: SCAFFOLD_NAME,
    ready: true,
    modules: ["app", "domain", "data", "auth", "shared"] as const,
  };
}
