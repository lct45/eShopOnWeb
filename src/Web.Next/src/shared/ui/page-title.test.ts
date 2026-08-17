import { describe, expect, it } from "vitest";
import {
  formatPageTitle,
  PAGE_TITLE_SUFFIX,
  PAGE_TITLE_TEMPLATE,
} from "@/shared/ui/page-title";

describe("page title convention", () => {
  it("uses the Microsoft.eShopOnWeb suffix template", () => {
    expect(PAGE_TITLE_SUFFIX).toBe("Microsoft.eShopOnWeb");
    expect(PAGE_TITLE_TEMPLATE).toBe("%s - Microsoft.eShopOnWeb");
  });

  it("formats page titles the same way as ASP.NET _Layout.cshtml", () => {
    expect(formatPageTitle("Catalog")).toBe("Catalog - Microsoft.eShopOnWeb");
    expect(formatPageTitle("Error")).toBe("Error - Microsoft.eShopOnWeb");
    expect(formatPageTitle("")).toBe("Microsoft.eShopOnWeb");
  });

  it("documents that root page titles need a child segment for the template", () => {
    // Next.js applies layout title.template only to child route segments.
    // Home lives under app/(storefront)/ so Catalog picks up the suffix.
    expect(PAGE_TITLE_TEMPLATE.includes(PAGE_TITLE_SUFFIX)).toBe(true);
  });
});
