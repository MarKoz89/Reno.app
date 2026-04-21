"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  calculateEstimate,
  getEstimateInputSummary,
} from "@/features/estimation/calculate-estimate";
import { saveProjectFromDraft } from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function getConfidenceLabel(score: number) {
  if (score >= 85) {
    return "Strong early estimate";
  }

  if (score >= 70) {
    return "Useful planning estimate";
  }

  if (score >= 50) {
    return "Broad estimate";
  }

  return "Rough starting point";
}

export default function ResultsPage() {
  const router = useRouter();
  const project = useDraftProject();

  function handleSaveProject() {
    const savedProject = saveProjectFromDraft();
    router.push(`/projects/${savedProject.id}`);
  }

  const estimate = project ? calculateEstimate(project) : undefined;
  const answers = project?.wizardAnswers;
  const inputSummary = answers ? getEstimateInputSummary(answers) : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Results
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Your renovation estimate
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        This planning range is calculated from your room details, scope, and quality level.
      </p>

      {!answers || !estimate || !inputSummary ? (
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
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Estimated planning range
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
              {currency.format(estimate.lowTotal)} - {currency.format(estimate.highTotal)}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Mid estimate: {currency.format(estimate.midTotal)}. This is an early planning estimate, not a contractor quote.
            </p>

            <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm font-medium text-zinc-900">Room</dt>
                <dd className="mt-1 text-sm text-zinc-600">{inputSummary.roomType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-900">Room size</dt>
                <dd className="mt-1 text-sm text-zinc-600">{inputSummary.roomSize}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-900">Scope</dt>
                <dd className="mt-1 text-sm text-zinc-600">{inputSummary.renovationScope}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-900">Quality</dt>
                <dd className="mt-1 text-sm text-zinc-600">{inputSummary.qualityLevel}</dd>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                Why this estimate
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Reno App uses fixed local pricing rules. The same room type, room size, scope, and quality level will produce the same estimate.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                <li>Room type sets the base cost per square meter.</li>
                <li>Scope adjusts the estimate for light, standard, or full renovation work.</li>
                <li>Quality level adjusts material and finish allowances.</li>
                <li>A simple complexity factor accounts for higher-risk room types, full scope, and sparse notes.</li>
              </ul>
            </section>

            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                Estimate confidence
              </h2>
              <p className="mt-3 text-3xl font-semibold text-zinc-950">
                {estimate.confidenceScore}/100
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-900">
                {getConfidenceLabel(estimate.confidenceScore)}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Confidence reflects how complete your inputs are. Photos, style selection, room details, and specific notes improve confidence; missing details reduce it.
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Confidence does not change the estimate total. It shows how much project detail Reno App had when creating this planning range.
              </p>
            </section>
          </div>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              What affects this estimate
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              These are the strongest confidence signals from your project inputs.
            </p>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-zinc-600 md:grid-cols-2">
              {estimate.confidenceReasons.map((reason) => (
                <li key={reason} className="rounded-md border border-zinc-200 p-3">
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              Cost breakdown
            </h2>
            <div className="mt-5 divide-y divide-zinc-200">
              {estimate.lineItems.map((item) => (
                <div key={item.label} className="py-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <h3 className="font-medium text-zinc-950">{item.label}</h3>
                    <p className="text-sm font-medium text-zinc-900">
                      {currency.format(item.low)} - {currency.format(item.high)}
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
                What this estimate assumes
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                These rules explain what the planning range is based on.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                {estimate.assumptions.map((assumption) => (
                  <li key={assumption} className="border-l-2 border-zinc-200 pl-3">
                    {assumption}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                Not included in this estimate
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                These items can change final project cost and should be checked before hiring.
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
                {estimate.exclusions.map((exclusion) => (
                  <li key={exclusion} className="border-l-2 border-zinc-300 pl-3">
                    {exclusion}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {answers.notes ? (
            <section className="rounded-lg border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-950">
                Your notes
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {answers.notes}
              </p>
            </section>
          ) : null}

          <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold text-zinc-950">
              Planning estimate only
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Reno App estimates are generated from fixed cost rules and your project inputs. Final costs can vary by location, contractor availability, site conditions, permits, taxes, and material choices.
            </p>
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
