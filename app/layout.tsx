import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { PreferencesSwitcher } from "@/features/ui/preferences-switcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Reno App",
    template: "%s | Reno App",
  },
  description: "Plan room renovations with guided steps and explainable estimates.",
  applicationName: "Reno App",
  manifest: "/manifest.webmanifest",
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
          <div className="mx-auto flex w-full max-w-5xl justify-end">
            <PreferencesSwitcher />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
