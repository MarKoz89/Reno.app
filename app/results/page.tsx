"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  calculateEstimate,
  getEstimateInputSummary,
} from "@/features/estimation/calculate-estimate";
import { saveProjectFromDraft } from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import { getDictionary } from "@/features/ui/dictionary";
import { formatCurrency } from "@/features/ui/format";
import { usePreferences } from "@/features/ui/use-preferences";

function getConfidenceLabel(
  score: number,
  labels: ReturnType<typeof getDictionary>["results"]["confidenceLabels"],
) {
  if (score >= 85) {
    return labels.strong;
  }

  if (score >= 70) {
    return labels.useful;
  }

  if (score >= 50) {
    return labels.broad;
  }

  return labels.rough;
}

function getMappedText(value: string, map: Record<string, string>) {
  return map[value] ?? value;
}

function localizeAssumption(
  assumption: string,
  text: ReturnType<typeof getDictionary>,
) {
  const assumptionText = text.estimateDomain.assumptions;
  const exact = getMappedText(assumption, assumptionText.exact);
  const roomSizeMatch = assumption.match(
    /^Room size was missing, so a (\d+(?:\.\d+)?) m2 planning size was used\.$/,
  );
  const marketFactorMatch = assumption.match(/^Market factor applied: (.+)\.$/);
  const catalogVersionMatch = assumption.match(
    /^Pricing catalog version: (.+)\.$/,
  );
  const complexityFactorMatch = assumption.match(
    /^Complexity factor applied: (.+)\.$/,
  );

  if (exact !== assumption) {
    return exact;
  }

  if (roomSizeMatch) {
    return assumptionText.roomSizeFallback(Number(roomSizeMatch[1]));
  }

  if (marketFactorMatch) {
    return assumptionText.marketFactor(marketFactorMatch[1]);
  }

  if (catalogVersionMatch) {
    return assumptionText.catalogVersion(catalogVersionMatch[1]);
  }

  if (complexityFactorMatch) {
    return assumptionText.complexityFactor(complexityFactorMatch[1]);
  }

  return assumption;
}

function localizeConfidenceReason(
  reason: string,
  text: ReturnType<typeof getDictionary>,
) {
  const confidenceText = text.estimateDomain.confidenceReasons;
  const exact = getMappedText(reason, confidenceText.exact);
  const missingFieldsMatch = reason.match(
    /^Missing (.+) reduced confidence because defaults were used\.$/,
  );

  if (exact !== reason) {
    return exact;
  }

  if (missingFieldsMatch) {
    const fields = missingFieldsMatch[1]
      .split(", ")
      .map((field) => getMappedText(field, confidenceText.fields))
      .join(", ");

    return confidenceText.missingFields(fields);
  }

  return reason;
}

export default function ResultsPage() {
  const router = useRouter();
  const project = useDraftProject();
  const { language, currency } = usePreferences();
  const text = getDictionary(language);

  function handleSaveProject() {
    const savedProject = saveProjectFromDraft();
    router.push(`/projects/${savedProject.id}`);
  }

  const estimate = project ? calculateEstimate(project) : undefined;
  const answers = project?.wizardAnswers;
  const inputSummary = answers ? getEstimateInputSummary(answers) : undefined;
  const localizedRoomType = answers
    ? text.wizard.roomTypes[answers.roomType]
    : inputSummary?.roomType;
  const localizedScope = answers?.renovationScope
    ? text.wizard.scopeOptions[answers.renovationScope]
    : inputSummary?.renovationScope;
  const localizedQuality = answers?.qualityLevel
    ? text.wizard.qualityOptions[answers.qualityLevel]
    : inputSummary?.qualityLevel;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.results.label}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {text.results.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        {text.results.intro}
      </p>

      {!answers || !estimate || !inputSummary ? (
        <div className="mt-8 rounded-lg border border-zinc-200 p-6">
          <p className="text-sm text-zinc-700">
            {text.results.completeWizard}
          </p>
          <Link
            href="/wizard"
            className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
          >
            {text.common.goToWizard}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          <section className="rounded-lg border border-zinc-200 p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              {text.results.estimatedPlanningRange}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(estimate.lowTotal, currency)} - {formatCurrency(estimate.highTotal, currency)}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {text.results.midEstimate}: {formatCurrency(estimate.midTotal, currency)}. {text.results.notQuote}
            </p>

            <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-zinc-900">
                  {text.common.room}
                </dt>
                <dd className="mt-1 text-sm text-zinc-600">{localizedRoomType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-900">
                  {text.report.roomSize}
                </dt>
                <dd className="mt-1 text-sm text-zinc-600">{inputSummary.roomSize}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-900">
                  {text.common.scope}
                </dt>
                <dd className="mt-1 text-sm text-zinc-600">{localizedScope}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-900">
                  {text.common.quality}
                </dt>
                <dd className="mt-1 text-sm text-zinc-600">{localizedQuality}</dd>
              </div>
            </div>
          </section>

          {project.selectedRedesignVariant ? (
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.results.preferredDesignDirection}
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
                    {text.results.inspirationNote}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.results.whyEstimate}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {text.results.whyEstimateBody}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                {text.results.whyEstimateItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.results.estimateConfidence}
              </h2>
              <p className="mt-3 text-3xl font-semibold text-zinc-950">
                {estimate.confidenceScore}/100
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-900">
                {getConfidenceLabel(
                  estimate.confidenceScore,
                  text.results.confidenceLabels,
                )}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {text.results.confidenceBody}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {text.results.confidenceTotalNote}
              </p>
              <div className="mt-5 border-t border-zinc-200 pt-4">
                <h3 className="text-sm font-medium text-zinc-950">
                  {text.results.confidenceReasonsTitle}
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                  {estimate.confidenceReasons.map((reason) => (
                    <li key={reason} className="border-l-2 border-zinc-200 pl-3">
                      {localizeConfidenceReason(reason, text)}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.results.costBreakdown}
            </h2>
            <div className="mt-5 divide-y divide-zinc-200">
              {estimate.lineItems.map((item) => (
                <div key={item.label} className="py-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <h3 className="font-medium text-zinc-950">
                      {getMappedText(item.label, text.estimateDomain.lineItemLabels)}
                    </h3>
                    <p className="text-sm font-medium text-zinc-900">
                      {formatCurrency(item.low, currency)} - {formatCurrency(item.high, currency)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {text.results.itemMid}: {formatCurrency(item.mid, currency)}.{" "}
                    {getMappedText(
                      item.explanation,
                      text.estimateDomain.lineItemExplanations,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.results.assumptionsTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {text.results.assumptionsBody}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                {estimate.assumptions.map((assumption) => (
                  <li key={assumption} className="border-l-2 border-zinc-200 pl-3">
                    {localizeAssumption(assumption, text)}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.results.exclusionsTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {text.results.exclusionsBody}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                {estimate.exclusions.map((exclusion) => (
                  <li key={exclusion} className="border-l-2 border-zinc-300 pl-3">
                    {getMappedText(exclusion, text.estimateDomain.exclusions)}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {answers.notes ? (
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.results.notesTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {answers.notes}
              </p>
            </section>
          ) : null}

          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold text-zinc-950">
              {text.results.planningOnlyTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {text.results.planningOnlyBody}
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-base font-semibold text-zinc-950">
              {text.results.premiumTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              {text.results.premiumBody}
            </p>
            <Link
              href="/report"
              className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
            >
              {text.common.previewReport}
            </Link>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveProject}
              className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
            >
              {text.results.saveProject}
            </button>
            <Link
              href="/projects"
              className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
            >
              {text.common.viewProjects}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
