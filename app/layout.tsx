import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PreferencesSwitcher } from "@/features/ui/preferences-switcher";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const seoDescription =
  "Plan room renovations with a guided AI workflow, style options, and explainable estimates that show assumptions and confidence.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Reno App | AI Renovation Planning and Explainable Estimates",
    template: "%s | Reno App",
  },
  description: seoDescription,
  applicationName: "Reno App",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Reno App | AI Renovation Planning",
    description: seoDescription,
    url: "/",
    siteName: "Reno App",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Reno App | AI Renovation Planning",
    description: seoDescription,
  },
  appleWebApp: {
    capable: true,
    title: "Reno App",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.svg", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <header className="border-b border-zinc-200 px-6 py-3">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-zinc-950"
            >
              Reno App
            </Link>
            <nav
              aria-label="Primary navigation"
              className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-700"
            >
              <Link href="/upload" className="hover:text-zinc-950">
                Start planning
              </Link>
              <Link href="/projects" className="hover:text-zinc-950">
                Saved projects
              </Link>
            </nav>
            <PreferencesSwitcher />
          </div>
        </header>
        {children}
        <footer className="mt-auto border-t border-zinc-200 px-6 py-6">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <p>Reno App helps homeowners plan room renovations.</p>
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap items-center gap-4"
            >
              <Link href="/" className="hover:text-zinc-950">
                Home
              </Link>
              <Link href="/privacy" className="hover:text-zinc-950">
                Privacy
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
