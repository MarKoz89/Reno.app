"use client";

import { Suspense } from "react";
import { ReportPageClient } from "./report-page-client";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

export default function ReportPage() {
  const { language } = usePreferences();
  const text = getDictionary(language);

  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
          <p className="text-sm text-zinc-600">{text.report.loading}</p>
        </main>
      }
    >
      <ReportPageClient />
    </Suspense>
  );
}
