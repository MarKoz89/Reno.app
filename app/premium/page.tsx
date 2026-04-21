import Link from "next/link";

export default function PremiumPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Premium
      </p>
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-950">
        Premium renovation planning, coming soon
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Reno App will keep estimates explainable and deterministic. Premium is a future planning layer for organizing your project before you talk to contractors.
      </p>

      <div className="mt-8 grid gap-6">
        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            What stays free
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
            <li>Create a renovation estimate</li>
            <li>Review assumptions, exclusions, and confidence</li>
            <li>Choose a style and mock redesign direction</li>
            <li>Save projects locally in this browser</li>
            <li>Return to previous local plans</li>
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            What Premium may include
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-zinc-600">
            <li>Contractor-ready scope summary</li>
            <li>Budget risk and tradeoff review</li>
            <li>Material and finish planning checklist</li>
            <li>Timeline preparation guide</li>
            <li>Exportable homeowner project packet</li>
            <li>AI-assisted explanations and recommendations later</li>
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-xl font-semibold text-zinc-950">
            Important note
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Premium will not replace Reno App&apos;s deterministic estimate engine or invent prices. Estimate totals should continue to come from fixed, explainable pricing logic.
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            No payment integration exists yet. This page is only a product shell for future premium planning tools.
          </p>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/results"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          Back to estimate
        </Link>
        <Link
          href="/projects"
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          View saved projects
        </Link>
      </div>
    </main>
  );
}
