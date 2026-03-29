import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { ThemeInit } from "@/components/ThemeBoot";
import { siteDescription, siteName, getSiteUrl } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

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
    images: [{ url: "/quadrato-logo-full.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/quadrato-logo-full.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/quadrato-logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/quadrato-logo-icon.png", sizes: "512x512", type: "image/png" }],
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
      className={`${jakarta.variable} ${spaceGrotesk.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeInit />
        <div className="body-gradient" aria-hidden />
        <div className="body-grid" aria-hidden />
        <div className="body-noise" aria-hidden />
        {children}
      </body>
    </html>
  );
}
