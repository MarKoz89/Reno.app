"use client";

import Link from "next/link";
import { useProjectsForDisplay } from "@/features/projects/use-local-projects";

export default function ProjectsPage() {
  const projects = useProjectsForDisplay();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Saved Projects
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Your renovation plans
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Saved projects are stored locally in this browser. A sample project appears when no saved projects exist yet.
      </p>

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
                  {project.selectedStyle?.name ?? "No style selected"} -{" "}
                  {project.uploadedImages[0]
                    ? "Room photo added"
                    : "No room photo selected yet"}
                </p>
                {project.selectedRedesignVariant ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    Design direction: {project.selectedRedesignVariant.title}
                  </p>
                ) : null}
              </div>
              {project.estimate ? (
                <div className="text-sm text-zinc-700 sm:text-right">
                  <p className="font-medium text-zinc-900">
                    ${project.estimate.lowTotal.toLocaleString()} - ${project.estimate.highTotal.toLocaleString()}
                  </p>
                  <p className="mt-1">
                    Mid ${project.estimate.midTotal.toLocaleString()} - Confidence {project.estimate.confidenceScore}/100
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
        Start another plan
      </Link>
    </main>
  );
}
