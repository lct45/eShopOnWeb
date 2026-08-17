/** Title suffix matching the ASP.NET `_Layout.cshtml` convention. */
export const PAGE_TITLE_SUFFIX = "Microsoft.eShopOnWeb";

/** Next.js metadata template: `"Catalog"` → `"Catalog - Microsoft.eShopOnWeb"`. */
export const PAGE_TITLE_TEMPLATE = `%s - ${PAGE_TITLE_SUFFIX}`;

export function formatPageTitle(pageTitle: string): string {
  const trimmed = pageTitle.trim();
  if (!trimmed) {
    return PAGE_TITLE_SUFFIX;
  }
  return `${trimmed} - ${PAGE_TITLE_SUFFIX}`;
}
