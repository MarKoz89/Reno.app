"use client";

import Link from "next/link";
import { useProjectsForDisplay } from "@/features/projects/use-local-projects";
import { getDictionary } from "@/features/ui/dictionary";
import { formatCurrency } from "@/features/ui/format";
import { usePreferences } from "@/features/ui/use-preferences";

export default function ProjectsPage() {
  const { isLoading, projects } = useProjectsForDisplay();
  const { language, currency } = usePreferences();
  const text = getDictionary(language);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.projects.label}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {text.projects.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        {text.projects.body}
      </p>

      {isLoading && projects.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600">
          {language === "cs"
            ? "Nacitaji se ulozene projekty..."
            : "Loading saved projects..."}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="rounded-lg border border-zinc-200 p-5 transition hover:border-zinc-400"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950">
                  {project.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {project.selectedStyle?.name ?? text.projects.noStyle} -{" "}
                  {project.uploadedImages[0]
                    ? text.projects.photoAdded
                    : text.projects.noPhoto}
                </p>
                {project.selectedRedesignVariant ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    {text.projects.designDirection(project.selectedRedesignVariant.title)}
                  </p>
                ) : null}
              </div>
              {project.estimate ? (
                <div className="text-sm text-zinc-700 sm:text-right">
                  <p className="font-medium text-zinc-900">
                    {formatCurrency(project.estimate.lowTotal, currency)} -{" "}
                    {formatCurrency(project.estimate.highTotal, currency)}
                  </p>
                  <p className="mt-1">
                    {text.projects.midConfidence(
                      formatCurrency(project.estimate.midTotal, currency),
                      project.estimate.confidenceScore,
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/upload"
        className="mt-8 inline-flex w-fit rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
      >
        {text.projects.startAnother}
      </Link>
    </main>
  );
}
