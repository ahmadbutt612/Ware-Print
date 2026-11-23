import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { SetupRequired } from "@/components/site/setup-required";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isSupabaseConfigured } from "@/lib/env";
import { site } from "@/lib/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-cond",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

function metadataBase(): URL | undefined {
  try {
    return new URL(site.url);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: "Ware Print — Printing & packaging machinery marketplace, Pakistan",
    template: "%s | Ware Print",
  },
  description: site.description,
  applicationName: "Ware Print",
  openGraph: {
    siteName: "Ware Print",
    type: "website",
    locale: "en_PK",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const configured = isSupabaseConfigured();

  return (
    <html lang="en" className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        {configured ? (
          <>
            <a
              href="#main"
              className="sr-only z-50 bg-ink px-3 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
            >
              Skip to content
            </a>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </>
        ) : (
          <SetupRequired />
        )}
      </body>
    </html>
  );
}
