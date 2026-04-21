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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const renovationChecklist = [
  "Confirm room measurements before asking for quotes.",
  "Decide which upgrades are must-haves and which are optional.",
  "Save the design direction and any inspiration photos in one place.",
  "Review the assumptions and exclusions before comparing prices.",
  "Ask contractors to separate labor, materials, and allowances.",
  "Check permit needs, lead times, and delivery constraints.",
  "Keep a contingency budget for hidden conditions or scope changes.",
];

const nextSteps = [
  "Review the estimate range and cost breakdown.",
  "Adjust the project details if the room size, scope, or quality level changes.",
  "Use the checklist to prepare questions for contractors.",
  "Compare contractor quotes against this planning range.",
];

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

function formatRoom(roomType?: string) {
  return roomType ? roomType.replace("-", " ") : "Not selected";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function PlanningInsightsSection({ project }: { project: ProjectSession }) {
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
                : "Planning insights are unavailable.",
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
                : "Planning insights are unavailable.",
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
  }, [planningInput]);

  return (
    <section className="rounded-lg border border-zinc-200 p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        Premium preview
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-950">
        Planning insights
      </h2>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        AI can help organize your project details into planning priorities,
        contractor questions, and items to confirm early. Pricing still comes
        only from Reno App&apos;s deterministic estimate engine.
      </p>

      {status === "idle" ? (
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Complete style and wizard details to generate planning insights.
        </p>
      ) : null}

      {status === "loading" ? (
        <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-600">
            Generating planning insights...
          </p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-900">
            Planning insights are unavailable.
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {errorMessage ??
              "You can still use the estimate, assumptions, checklist, and next steps."}
          </p>
        </div>
      ) : null}

      {status === "ready" && insights ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-950">
              Recommended priorities
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
              Questions to ask contractors
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
              Things to check early
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
          Planning Report
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          No project found
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Start a renovation plan or open a saved project to preview a report.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/upload"
            className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
          >
            Start a plan
          </Link>
          <Link
            href="/projects"
            className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
          >
            View projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <header className="border-b border-zinc-200 pb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Renovation planning report
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {project.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
          A local preview of your selected design direction, planning estimate,
          assumptions, exclusions, checklist, and next steps.
        </p>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-medium text-zinc-900">Room</dt>
            <dd className="mt-1 text-zinc-600">
              {formatRoom(answers?.roomType)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Style</dt>
            <dd className="mt-1 text-zinc-600">
              {project.selectedStyle?.name ?? "Not selected"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-900">Updated</dt>
            <dd className="mt-1 text-zinc-600">
              {formatDate(project.updatedAt)}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 py-8">
        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            Project summary
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-medium text-zinc-900">Room size</dt>
              <dd className="mt-1 text-zinc-600">
                {inputSummary?.roomSize ?? "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Scope</dt>
              <dd className="mt-1 text-zinc-600">
                {inputSummary?.renovationScope ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Quality</dt>
              <dd className="mt-1 text-zinc-600">
                {inputSummary?.qualityLevel ?? "Not selected"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Photos</dt>
              <dd className="mt-1 text-zinc-600">
                {project.uploadedImages.length}
              </dd>
            </div>
          </dl>
          {answers?.notes ? (
            <div className="mt-5 border-t border-zinc-200 pt-5">
              <h3 className="text-sm font-medium text-zinc-900">
                Project notes
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {answers.notes}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            Selected redesign variant
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
                  Inspiration only. This selection does not change the estimate.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              No redesign variant has been selected for this project yet.
            </p>
          )}
        </section>

        <PlanningInsightsSection project={project} />

        {estimate ? (
          <>
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                Estimate summary
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm font-medium text-zinc-900">Low</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-950">
                    {currency.format(estimate.lowTotal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-900">Mid</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-950">
                    {currency.format(estimate.midTotal)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-900">High</dt>
                  <dd className="mt-1 text-2xl font-semibold text-zinc-950">
                    {currency.format(estimate.highTotal)}
                  </dd>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                Confidence: {estimate.confidenceScore}/100. This range uses the
                same deterministic estimate engine shown on the results page.
              </p>
            </section>

            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                Cost breakdown
              </h2>
              <div className="mt-5 divide-y divide-zinc-200">
                {estimate.lineItems.map((item) => (
                  <div key={item.label} className="py-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <h3 className="font-medium text-zinc-950">
                        {item.label}
                      </h3>
                      <p className="text-sm font-medium text-zinc-900">
                        {currency.format(item.low)} -{" "}
                        {currency.format(item.high)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Mid: {currency.format(item.mid)}. {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border border-zinc-200 p-6">
                <h2 className="text-xl font-semibold text-zinc-950">
                  Assumptions
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
                  Exclusions
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
              Estimate summary
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Complete the wizard to add a deterministic estimate to this
              planning report.
            </p>
            <Link
              href="/wizard"
              className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
            >
              Go to wizard
            </Link>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Renovation checklist
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
              {renovationChecklist.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">Next steps</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
              {nextSteps.map((item) => (
                <li key={item} className="border-l-2 border-zinc-200 pl-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-base font-semibold text-zinc-950">
            Local planning preview only
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            This report is a local product shell for planning. It does not
            generate a PDF, export a file, process payment, or replace a
            contractor quote.
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-8 sm:flex-row">
        <Link
          href={projectId ? `/projects/${projectId}` : "/results"}
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          Back to project
        </Link>
        <Link
          href="/projects"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          View saved projects
        </Link>
      </div>
    </main>
  );
}
