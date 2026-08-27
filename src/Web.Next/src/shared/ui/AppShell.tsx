import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader, type SiteHeaderProps } from "./SiteHeader";

export type AppShellProps = SiteHeaderProps & {
  children: ReactNode;
};

/**
 * Shared visual shell: header with nav slots, main content, footer.
 * No feature-specific data fetching lives here.
 */
export function AppShell({
  children,
  identitySlot,
  basketSlot,
}: AppShellProps) {
  return (
    <div className="esh-app-wrapper">
      <SiteHeader identitySlot={identitySlot} basketSlot={basketSlot} />
      <main className="esh-app-body container">{children}</main>
      <SiteFooter />
    </div>
  );
}
