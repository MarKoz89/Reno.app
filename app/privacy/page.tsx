import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Privacy information for Reno App, including current MVP data handling and items pending legal review.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Privacy
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Privacy Notice
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">
        This page summarizes how the current Reno App MVP handles data based on
        the product behavior visible in this repository. It is a placeholder for
        transparency and still requires legal review before being treated as a
        final privacy policy.
      </p>

      <section
        aria-labelledby="privacy-current-behavior"
        className="mt-10 rounded-lg border border-zinc-200 p-6"
      >
        <h2
          id="privacy-current-behavior"
          className="text-xl font-semibold text-zinc-950"
        >
          What can be verified from the current product
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
          <li>
            Reno App stores draft projects, saved projects, and user
            preferences in browser local storage on the device using the app.
          </li>
          <li>
            Project data can include room photos, selected style, planning
            answers, notes, and saved estimate details.
          </li>
          <li>
            When a user requests AI redesign suggestions, the uploaded room
            photo and selected style are sent from the app server to the
            configured AI provider.
          </li>
          <li>
            When a user requests planning insights, project inputs such as room
            type, room size, scope, quality level, notes, language, and selected
            style are sent from the app server to the configured AI provider.
          </li>
          <li>
            The deterministic renovation estimate logic runs inside the app and
            is not replaced by the AI endpoints.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="privacy-not-yet-confirmed"
        className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6"
      >
        <h2
          id="privacy-not-yet-confirmed"
          className="text-xl font-semibold text-zinc-950"
        >
          Not yet confirmed in final policy text
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          The repository does not by itself confirm the final legal basis,
          retention schedule, controller identity, contact details, subprocessors,
          international transfer language, or data subject rights wording for
          production use. Those items must be reviewed and completed by the
          project owner and legal counsel.
        </p>
      </section>

      <section aria-labelledby="privacy-mvp-notes" className="mt-10">
        <h2
          id="privacy-mvp-notes"
          className="text-xl font-semibold text-zinc-950"
        >
          MVP notes
        </h2>
        <div className="mt-4 grid gap-4">
          <section className="rounded-lg border border-zinc-200 p-6">
            <h3 className="text-base font-semibold text-zinc-950">
              Local browser storage
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              The current app stores project and preference data locally in the
              browser. Clearing browser storage may remove local data. This page
              does not guarantee whether any hosting, server, or provider logs
              are retained outside the browser.
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h3 className="text-base font-semibold text-zinc-950">
              AI features
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              AI features are optional product actions initiated by the user.
              The current code shows requests to OpenAI endpoints for image
              editing and planning insight generation when those features are
              used.
            </p>
          </section>

          <section className="rounded-lg border border-zinc-200 p-6">
            <h3 className="text-base font-semibold text-zinc-950">
              TODO for legal review
            </h3>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
              <li>TODO: Insert legal entity name and contact details.</li>
              <li>
                TODO: Confirm production hosting, logging, analytics, and
                subprocessor disclosures.
              </li>
              <li>
                TODO: Confirm retention periods and deletion handling for user
                requests.
              </li>
              <li>
                TODO: Add jurisdiction-specific privacy rights text if required.
              </li>
              <li>
                TODO: Review whether additional cookie or consent language is
                needed before adding non-essential tracking.
              </li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
