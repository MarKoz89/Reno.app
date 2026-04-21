"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useProjectForDisplay } from "@/features/projects/use-local-projects";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const project = useProjectForDisplay(params.projectId);
  const savedEstimate = project?.estimate;
  const midEstimate = savedEstimate
    ? savedEstimate.midTotal ??
      Math.round((savedEstimate.lowTotal + savedEstimate.highTotal) / 2)
    : undefined;

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
              <dt className="font-medium text-zinc-900">Room photo</dt>
              <dd className="mt-1 text-zinc-600">
                {project.uploadedImages[0] ? "Room photo added" : "No room photo selected yet"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Scope</dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.renovationScope ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Quality</dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.qualityLevel ?? "Not selected"}
              </dd>
            </div>
          </dl>
        </section>

        {project.selectedRedesignVariant ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Preferred design direction
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
              <div
                aria-label={`${project.selectedRedesignVariant.title} mock preview`}
                className="aspect-[4/3] w-full rounded-md bg-cover bg-center"
                role="img"
                style={{
                  backgroundImage: `url(${project.selectedRedesignVariant.imageUrl})`,
                }}
              />
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  {project.selectedRedesignVariant.styleLabel}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-950">
                  {project.selectedRedesignVariant.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {project.selectedRedesignVariant.description}
                </p>
                <p className="mt-3 text-sm text-zinc-500">
                  Inspiration only. This selection does not change the estimate.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {savedEstimate ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Saved estimate
            </h2>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">
              ${savedEstimate.lowTotal.toLocaleString()} - ${savedEstimate.highTotal.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Mid estimate: ${midEstimate?.toLocaleString()} - Confidence: {savedEstimate.confidenceScore ?? "not scored"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Engine version: {savedEstimate.engineVersion ?? "legacy"}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {savedEstimate.lineItems.map((item) => (
                <li key={item.label}>
                  {item.label}: ${item.low.toLocaleString()} - ${item.high.toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {savedEstimate?.assumptions?.length ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">Assumptions</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {savedEstimate.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {savedEstimate?.exclusions?.length ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">Exclusions</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {savedEstimate.exclusions.map((exclusion) => (
                <li key={exclusion}>{exclusion}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            Premium project packet
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Premium may help turn this saved renovation into a clearer planning packet. Your saved estimate and project details remain available for free.
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
            <li>Printable renovation brief</li>
            <li>Decision checklist</li>
            <li>Contractor question list</li>
            <li>Room-by-room planning notes</li>
          </ul>
          <Link
            href={`/report?projectId=${project.id}`}
            className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Preview report
          </Link>
        </section>
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
