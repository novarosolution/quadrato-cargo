import type { Metadata, Viewport } from "next";
import { Manrope, Outfit } from "next/font/google";
import { ThemeInit } from "@/components/ThemeBoot";
import { siteDescription, siteName, getSiteUrl } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

/** Allow browser zoom (accessibility); explicit defaults for mobile browsers. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#06080f" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [{ url: "/quadrato-logo-full.png", alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/quadrato-logo-full.png"],
  },
  /**
   * Browser tab icon: Next injects `src/app/icon.svg` (brand grid) automatically.
   * PNG + ICO here as fallbacks; Apple uses PNG for home-screen / bookmarks.
   */
  icons: {
    icon: [
      { url: "/quadrato-logo-icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    apple: [{ url: "/quadrato-logo-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${manrope.variable} ${outfit.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeInit />
        <div className="body-gradient" aria-hidden />
        <div className="body-grid" aria-hidden />
        <div className="body-noise" aria-hidden />
        {/* Keep all routes above fixed background layers (avoids rare clipping). */}
        <div className="relative z-10 min-h-full">{children}</div>
      </body>
    </html>
  );
}
