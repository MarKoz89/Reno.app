"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import {
  saveProjectFromDraft,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function ResultsPage() {
  const router = useRouter();
  const project = useDraftProject();

  function handleSaveProject() {
    const savedProject = saveProjectFromDraft();
    router.push(`/projects/${savedProject.id}`);
  }

  const estimate = project ? calculateEstimate(project) : undefined;
  const answers = project?.wizardAnswers;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Results
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Renovation plan and estimate
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        This mock result is generated from your local draft and deterministic estimate rules.
      </p>

      {!answers || !estimate ? (
        <div className="mt-8 rounded-lg border border-zinc-200 p-6">
          <p className="text-sm text-zinc-700">
            Complete the wizard first to generate results.
          </p>
          <Link
            href="/wizard"
            className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
          >
            Go to wizard
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              {project.selectedStyle?.name ?? "Selected style"} {answers.roomType.replace("-", " ")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              A {answers.renovationGoal.replace("-", " ")} focused on {answers.priority}. Budget target: {answers.budgetRange.replace("-", " to ")}.
            </p>
            {answers.notes ? (
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Notes: {answers.notes}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Estimated planning range
            </h2>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">
              {currency.format(estimate.lowTotal)} - {currency.format(estimate.highTotal)}
            </p>
            <div className="mt-5 divide-y divide-zinc-200">
              {estimate.lineItems.map((item) => (
                <div key={item.label} className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium text-zinc-950">{item.label}</h3>
                    <p className="text-sm font-medium text-zinc-900">
                      {currency.format(item.low)} - {currency.format(item.high)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">Assumptions</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
              {estimate.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveProject}
              className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
            >
              Save project
            </button>
            <Link
              href="/projects"
              className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
            >
              View projects
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
