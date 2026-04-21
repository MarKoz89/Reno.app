"use client";

import Link from "next/link";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

export default function Home() {
  const { language } = usePreferences();
  const text = getDictionary(language);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.common.appName}
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950">
        {text.landing.headline}
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
        {text.landing.body}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/upload"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.common.startPlanning}
        </Link>
        <Link
          href="/projects"
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          {text.common.viewSavedProjects}
        </Link>
      </div>
    </main>
  );
}
