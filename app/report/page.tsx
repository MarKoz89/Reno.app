import { Suspense } from "react";
import { ReportPageClient } from "./report-page-client";

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
          <p className="text-sm text-zinc-600">Loading planning report...</p>
        </main>
      }
    >
      <ReportPageClient />
    </Suspense>
  );
}
