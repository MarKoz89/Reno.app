"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  calculateEstimate,
  getEstimateInputSummary,
} from "@/features/estimation/calculate-estimate";
import {
  getDraftProject,
  getProjectForDisplayById,
  subscribeToProjectStorage,
} from "@/features/projects/local-projects";
import type {
  ProjectSession,
  RenovationEstimate,
} from "@/features/projects/types";
import { getDictionary } from "@/features/ui/dictionary";
import { formatCurrency } from "@/features/ui/format";
import { usePreferences } from "@/features/ui/use-preferences";

type PlanningInsightsStatus = "idle" | "loading" | "ready" | "error";

type PlanningInsights = {
  recommendations: string[];
  contractorQuestions: string[];
  risks: string[];
};

type PlanningInsightsResponse =
  | ({
      ok: true;
    } & PlanningInsights)
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

function getProjectForReport(projectId: string | null) {
  return projectId ? getProjectForDisplayById(projectId) : getDraftProject();
}

function useReportProject(projectId: string | null) {
  const [project, setProject] = useState<ProjectSession | null>(null);

  useEffect(() => {
    function updateProject() {
      setProject(getProjectForReport(projectId));
    }

    updateProject();
    return subscribeToProjectStorage(updateProject);
  }, [projectId]);

  return project;
}

function getEstimate(project: ProjectSession): RenovationEstimate | undefined {
  if (project.estimate) {
    return project.estimate;
  }

  if (!project.wizardAnswers) {
    return undefined;
  }

  return calculateEstimate(project);
}

function formatRoom(roomType: string | undefined, text: ReturnType<typeof getDictionary>) {
  if (roomType && roomType in text.wizard.roomTypes) {
    return text.wizard.roomTypes[roomType as keyof typeof text.wizard.roomTypes];
  }

  return text.common.notSelected;
}

function formatDate(value: string, language: "en" | "cs") {
  return new Intl.DateTimeFormat(language === "cs" ? "cs-CZ" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function PlanningInsightsSection({ project }: { project: ProjectSession }) {
  const { language } = usePreferences();
  const text = getDictionary(language);
  const answers = project.wizardAnswers;
  const style = project.selectedStyle;
  const styleId = style?.id;
  const roomType = answers?.roomType;
  const roomSizeM2 = answers?.roomSizeM2;
  const renovationScope = answers?.renovationScope;
  const qualityLevel = answers?.qualityLevel;
  const notes = answers?.notes ?? "";
  const planningInput = useMemo(() => {
    if (
      !styleId ||
      !roomType ||
      !renovationScope ||
      !qualityLevel
    ) {
      return null;
    }

    return {
      styleId,
      roomType,
      roomSizeM2,
      renovationScope,
      qualityLevel,
      notes,
    };
  }, [notes, qualityLevel, renovationScope, roomSizeM2, roomType, styleId]);
  const [status, setStatus] = useState<PlanningInsightsStatus>("idle");
  const [insights, setInsights] = useState<PlanningInsights | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      async function loadPlanningInsights() {
        if (!planningInput) {
          setStatus("idle");
          setInsights(null);
          return;
        }

        setStatus("loading");
        setErrorMessage(null);
        setInsights(null);

        try {
          const response = await fetch("/api/planning", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(planningInput),
            signal: controller.signal,
          });
          const data = (await response.json()) as PlanningInsightsResponse;

          if (!response.ok || !data.ok) {
            throw new Error(
              !data.ok
                ? data.error?.message
                : text.report.planningInsightsUnavailable,
            );
          }

          setInsights({
            recommendations: data.recommendations,
            contractorQuestions: data.contractorQuestions,
            risks: data.risks,
          });
          setStatus("ready");
        } catch (error) {
          if (!controller.signal.aborted) {
            setStatus("error");
            setErrorMessage(
              error instanceof Error
                ? error.message
                : text.report.planningInsightsUnavailable,
            );
          }
        }
      }

      void loadPlanningInsights();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [planningInput, text]);

  return (
    <section className="rounded-lg border border-zinc-200 p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.report.premiumPreview}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-950">
        {text.report.planningInsights}
      </h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        {text.report.planningInsightsBody}
      </p>

      {status === "idle" ? (
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          {text.report.planningInsightsIdle}
        </p>
      ) : null}

      {status === "loading" ? (
        <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">
            {text.report.planningInsightsLoading}
          </p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-900">
            {text.report.planningInsightsUnavailable}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {errorMessage ?? text.report.planningInsightsUnavailableBody}
          </p>
        </div>
      ) : null}

      {status === "ready" && insights ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-950">
              {text.report.recommendedPriorities}
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {insights.recommendations.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-950">
              {text.report.contractorQuestions}
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {insights.contractorQuestions.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-950">
              {text.report.thingsToCheck}
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {insights.risks.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function ReportPageClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { language, currency } = usePreferences();
  const text = getDictionary(language);
  const project = useReportProject(projectId);
  const estimate = useMemo(
    () => (project ? getEstimate(project) : undefined),
    [project],
  );
  const answers = project?.wizardAnswers;
  const inputSummary = answers ? getEstimateInputSummary(answers) : undefined;

  if (!project) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.report.title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {text.report.notFound}
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          {text.report.notFoundBody}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/upload"
            className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
          >
            {text.common.startPlan}
          </Link>
          <Link
            href="/projects"
            className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
          >
            {text.common.viewProjects}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <header className="border-b border-zinc-200 pb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.report.title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {project.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          {text.report.headerBody}
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-medium text-zinc-900">{text.common.room}</dt>
            <dd className="mt-1 text-zinc-600">
              {formatRoom(answers?.roomType, text)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">{text.common.style}</dt>
            <dd className="mt-1 text-zinc-600">
              {project.selectedStyle?.name ?? text.common.notSelected}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">{text.common.updated}</dt>
            <dd className="mt-1 text-zinc-600">
              {formatDate(project.updatedAt, language)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 py-8">
        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.report.projectSummary}
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-medium text-zinc-900">{text.report.roomSize}</dt>
              <dd className="mt-1 text-zinc-600">
                {inputSummary?.roomSize ?? text.report.notProvided}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">{text.common.scope}</dt>
              <dd className="mt-1 text-zinc-600">
                {inputSummary?.renovationScope ?? text.common.notSelected}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">{text.common.quality}</dt>
              <dd className="mt-1 text-zinc-600">
                {inputSummary?.qualityLevel ?? text.common.notSelected}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">{text.report.roomPhoto}</dt>
              <dd className="mt-1 text-zinc-600">
                {project.uploadedImages[0]
                  ? text.report.photoAdded
                  : text.report.noPhoto}
              </dd>
            </div>
          </dl>
          {answers?.notes ? (
            <div className="mt-5 border-t border-zinc-200 pt-5">
              <h3 className="text-sm font-medium text-zinc-900">
                {text.report.projectNotes}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {answers.notes}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            {text.report.selectedRedesignVariant}
          </h2>
          {project.selectedRedesignVariant ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
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
                  {text.report.inspirationNote}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {text.report.noRedesignVariant}
            </p>
          )}
        </section>

        <PlanningInsightsSection project={project} />

        {estimate ? (
          <>
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.report.estimateSummary}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-zinc-900">{text.common.low}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-950">
                    {formatCurrency(estimate.lowTotal, currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-900">{text.common.mid}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-950">
                    {formatCurrency(estimate.midTotal, currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-900">{text.common.high}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-950">
                    {formatCurrency(estimate.highTotal, currency)}
                  </dd>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                {text.report.confidenceSummary(estimate.confidenceScore)}
              </p>
            </section>

            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                {text.report.costBreakdown}
              </h2>
              <div className="mt-5 divide-y divide-zinc-200">
                {estimate.lineItems.map((item) => (
                  <div key={item.label} className="py-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <h3 className="font-medium text-zinc-950">
                        {item.label}
                      </h3>
                      <p className="text-sm font-medium text-zinc-900">
                        {formatCurrency(item.low, currency)} -{" "}
                        {formatCurrency(item.high, currency)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {text.common.midLabel}: {formatCurrency(item.mid, currency)}. {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-zinc-200 p-6">
                <h2 className="text-xl font-semibold text-zinc-950">
                  {text.report.assumptions}
                </h2>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                  {estimate.assumptions.map((assumption) => (
                    <li
                      key={assumption}
                      className="border-l-2 border-zinc-200 pl-3"
                    >
                      {assumption}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-zinc-200 p-6">
                <h2 className="text-xl font-semibold text-zinc-950">
                  {text.report.exclusions}
                </h2>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                  {estimate.exclusions.map((exclusion) => (
                    <li
                      key={exclusion}
                      className="border-l-2 border-zinc-300 pl-3"
                    >
                      {exclusion}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : (
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.report.estimateSummary}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {text.report.completeWizard}
            </p>
            <Link
              href="/wizard"
              className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
            >
              {text.common.goToWizard}
            </Link>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.report.checklistTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
              {text.report.checklist.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {text.report.nextStepsTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
              {text.report.nextSteps.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-base font-semibold text-zinc-950">
            {text.report.localPreviewTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {text.report.localPreviewBody}
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-8 sm:flex-row">
        <Link
          href={projectId ? `/projects/${projectId}` : "/results"}
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          {text.common.backToProject}
        </Link>
        <Link
          href="/projects"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.common.viewSavedProjects}
        </Link>
      </div>
    </main>
  );
}
