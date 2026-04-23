"use client";

import Link from "next/link";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

export default function Home() {
  const { language } = usePreferences();
  const text = getDictionary(language);

  return (
    <main className="flex min-h-screen flex-col px-6 py-16">
      <section
        aria-labelledby="home-heading"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center"
      >
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.common.appName}
        </p>
        <h1
          id="home-heading"
          className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950"
        >
          {text.landing.headline}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
          {text.landing.body}
        </p>
        <nav
          aria-label="Renovation planning actions"
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
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
        </nav>
      </section>

      <section
        aria-labelledby="home-flow-heading"
        className="mx-auto grid w-full max-w-5xl gap-4 border-t border-zinc-200 pt-8 text-left md:grid-cols-3"
      >
        <div>
          <h2
            id="home-flow-heading"
            className="text-base font-semibold text-zinc-950"
          >
            Guided renovation flow
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Start with a room photo, choose a style, and answer a few planning
            questions.
          </p>
        </div>
        <section aria-labelledby="home-estimates-heading">
          <h3
            id="home-estimates-heading"
            className="text-base font-semibold text-zinc-950"
          >
            Explainable estimates
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Results show assumptions, exclusions, and confidence instead of a
            black-box quote.
          </p>
        </section>
        <section aria-labelledby="home-projects-heading">
          <h3
            id="home-projects-heading"
            className="text-base font-semibold text-zinc-950"
          >
            Local saved projects
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Keep renovation plans on this device and return to them when you are
            ready.
          </p>
        </section>
      </section>
    </main>
  );
}
