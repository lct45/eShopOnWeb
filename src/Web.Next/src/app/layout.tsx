import type { Metadata } from "next";
import { AppShell } from "@/shared/ui";
import { PAGE_TITLE_SUFFIX, PAGE_TITLE_TEMPLATE } from "@/shared/ui/page-title";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: PAGE_TITLE_SUFFIX,
    template: PAGE_TITLE_TEMPLATE,
  },
  description: "eShopOnWeb storefront migrated to Next.js",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
