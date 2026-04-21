"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useProjectForDisplay } from "@/features/projects/use-local-projects";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const project = useProjectForDisplay(params.projectId);

  if (!project) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Saved Project
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Project not found
        </h1>
        <Link
          href="/projects"
          className="mt-6 inline-flex w-fit rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          Back to projects
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Saved Project
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {project.name}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Reopened from local browser storage or the built-in sample project.
      </p>

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">Project summary</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-900">Style</dt>
              <dd className="mt-1 text-zinc-600">
                {project.selectedStyle?.name ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Room</dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.roomType.replace("-", " ") ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Photos</dt>
              <dd className="mt-1 text-zinc-600">
                {project.uploadedImages.length}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Priority</dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.priority ?? "Not selected"}
              </dd>
            </div>
          </dl>
        </section>

        {project.estimate ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Saved estimate
            </h2>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">
              ${project.estimate.lowTotal.toLocaleString()} - ${project.estimate.highTotal.toLocaleString()}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {project.estimate.lineItems.map((item) => (
                <li key={item.label}>
                  {item.label}: ${item.low.toLocaleString()} - ${item.high.toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/projects"
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          Back to projects
        </Link>
        <Link
          href="/upload"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          Start new plan
        </Link>
      </div>
    </main>
  );
}
