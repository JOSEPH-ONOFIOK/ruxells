import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const TITLE = "RUXXELLS · Clearance required";
const DESCRIPTION =
  "Six sectors, one door, and a list that closes. Clear four steps to be sure of a spot on the free mint.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },

  // A template so /clearance and anything added later get "<page> — RUXXELLS"
  // without each page restating the brand.
  title: { default: TITLE, template: "%s · RUXXELLS" },
  description: DESCRIPTION,
  applicationName: "RUXXELLS",
  keywords: ["RUXXELLS", "NFT", "free mint", "PFP", "allowlist", "pixel art"],

  openGraph: {
    type: "website",
    url: "/",
    siteName: "RUXXELLS",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#050607",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior tells Next the smooth scroll in globals.css is
    // deliberate, so it suppresses it on route changes rather than warning.
    <html lang="en" data-scroll-behavior="smooth">
      <body className="scanlines grain antialiased">{children}</body>
    </html>
  );
}
