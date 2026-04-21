"use client";

import Link from "next/link";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

export default function PremiumPage() {
  const { language } = usePreferences();
  const text = getDictionary(language);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.premium.label}
      </p>
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-950">
        {text.premium.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        {text.premium.body}
      </p>

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.premium.freeTitle}
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
            {text.premium.freeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.premium.premiumTitle}
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
            {text.premium.premiumItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.premium.noteTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {text.premium.noteBody}
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {text.premium.noPayments}
          </p>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/results"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.premium.backToEstimate}
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
