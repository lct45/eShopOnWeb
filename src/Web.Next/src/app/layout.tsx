import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eShopOnWeb Next.js",
  description: "Next.js foundation for the eShopOnWeb migration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
