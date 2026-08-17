import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const publicRoot = resolve(__dirname, "../../public");

describe("static asset pipeline", () => {
  it("ports brand, product, font, and favicon assets into public/", () => {
    const requiredAssets = [
      "favicon.ico",
      "images/brand.png",
      "images/cart.png",
      "images/main_banner.png",
      "images/products/1.png",
      "images/products/12.png",
      "images/products/eCatalog-item-default.png",
      "fonts/Montserrat-Regular.woff2",
      "fonts/Montserrat-Bold.woff2",
    ];

    for (const relativePath of requiredAssets) {
      expect(
        existsSync(resolve(publicRoot, relativePath)),
        `missing public/${relativePath}`,
      ).toBe(true);
    }
  });
});
