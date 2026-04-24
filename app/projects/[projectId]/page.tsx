"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useProjectForDisplay } from "@/features/projects/use-local-projects";
import { getDictionary } from "@/features/ui/dictionary";
import { formatCurrency } from "@/features/ui/format";
import { usePreferences } from "@/features/ui/use-preferences";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const { isLoading, project } = useProjectForDisplay(params.projectId);
  const { language, currency } = usePreferences();
  const text = getDictionary(language);
  const savedEstimate = project?.estimate;
  const materialPreferencesLabel =
    language === "cs" ? "Materialy a povrchy" : "Material preferences";
  const projectNotesLabel =
    language === "cs" ? "Poznamky k projektu" : "Project notes";
  const midEstimate = savedEstimate
    ? savedEstimate.midTotal ??
      Math.round((savedEstimate.lowTotal + savedEstimate.highTotal) / 2)
    : undefined;

  if (isLoading && !project) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.projectDetail.label}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {language === "cs"
            ? "Nacitani projektu"
            : "Loading project"}
        </h1>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.projectDetail.label}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {text.projectDetail.notFound}
        </h1>
        <Link
          href="/projects"
          className="mt-6 inline-flex w-fit rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.common.backToProjects}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.projectDetail.label}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {project.name}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        {text.projectDetail.reopened}
      </p>

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.projectDetail.summary}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-900">{text.common.style}</dt>
              <dd className="mt-1 text-zinc-600">
                {project.selectedStyle?.name ?? text.common.notSelected}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">{text.common.room}</dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.roomType.replace("-", " ") ??
                  text.common.notSelected}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">
                {text.projectDetail.roomPhoto}
              </dt>
              <dd className="mt-1 text-zinc-600">
                {project.uploadedImages[0]
                  ? text.projectDetail.photoAdded
                  : text.projectDetail.noPhoto}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">{text.common.scope}</dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.renovationScope ??
                  text.common.notSelected}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">
                {text.common.quality}
              </dt>
              <dd className="mt-1 text-zinc-600">
                {project.wizardAnswers?.qualityLevel ?? text.common.notSelected}
              </dd>
            </div>
          </dl>
          {project.wizardAnswers?.materialPreferences ? (
            <div className="mt-5 border-t border-zinc-200 pt-5">
              <dt className="text-sm font-medium text-zinc-900">
                {materialPreferencesLabel}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-zinc-600">
                {project.wizardAnswers.materialPreferences}
              </dd>
            </div>
          ) : null}
          {project.wizardAnswers?.notes ? (
            <div className="mt-5 border-t border-zinc-200 pt-5">
              <dt className="text-sm font-medium text-zinc-900">
                {projectNotesLabel}
              </dt>
              <dd className="mt-2 text-sm leading-6 text-zinc-600">
                {project.wizardAnswers.notes}
              </dd>
            </div>
          ) : null}
        </section>

        {project.selectedRedesignVariant ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.projectDetail.preferredDesignDirection}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
              <div
                aria-label={text.projectDetail.previewLabel(
                  project.selectedRedesignVariant.title,
                )}
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
                  {text.projectDetail.inspirationNote}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {savedEstimate ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.projectDetail.savedEstimate}
            </h2>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">
              {formatCurrency(savedEstimate.lowTotal, currency)} -{" "}
              {formatCurrency(savedEstimate.highTotal, currency)}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              {text.projectDetail.midEstimate}:{" "}
              {midEstimate ? formatCurrency(midEstimate, currency) : text.common.notSelected} -{" "}
              {text.common.confidence}:{" "}
              {savedEstimate.confidenceScore ?? text.projectDetail.notScored}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {text.projectDetail.engineVersion}:{" "}
              {savedEstimate.engineVersion ?? text.projectDetail.legacy}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-600">
              {savedEstimate.lineItems.map((item) => (
                <li key={item.label}>
                  {item.label}: {formatCurrency(item.low, currency)} -{" "}
                  {formatCurrency(item.high, currency)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {savedEstimate?.assumptions?.length ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.projectDetail.assumptions}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {savedEstimate.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {savedEstimate?.exclusions?.length ? (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.projectDetail.exclusions}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {savedEstimate.exclusions.map((exclusion) => (
                <li key={exclusion}>{exclusion}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.projectDetail.premiumPacket}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {text.projectDetail.premiumBody}
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
            {text.projectDetail.premiumItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link
            href={`/report?projectId=${project.id}`}
            className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            {text.common.previewReport}
          </Link>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/projects"
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          {text.common.backToProjects}
        </Link>
        <Link
          href="/upload"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.projectDetail.startNew}
        </Link>
      </div>
    </main>
  );
}
