import type { Metadata } from "next";
import { HomePageClient } from "./home-page-client";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const siteUrl = getSiteUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": new URL("/#website", siteUrl).toString(),
        url: new URL("/", siteUrl).toString(),
        name: "Reno App",
        description:
          "AI renovation planning app with a guided room renovation flow and explainable estimates.",
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": new URL("/#software", siteUrl).toString(),
        name: "Reno App",
        applicationCategory: "Home renovation planning application",
        operatingSystem: "Web",
        url: new URL("/", siteUrl).toString(),
        description:
          "Reno App helps homeowners plan room renovations with guided steps, explainable estimates, AI redesign inspiration, and local saved projects.",
        featureList: [
          "Guided room renovation flow",
          "Explainable renovation estimates",
          "AI redesign inspiration from room photos",
          "Locally saved renovation projects",
        ],
        isPartOf: {
          "@id": new URL("/#website", siteUrl).toString(),
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomePageClient />
    </>
  );
}
