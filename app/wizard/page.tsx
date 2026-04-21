"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { scopeOptions } from "@/features/estimation/calculate-estimate";
import { updateWizardAnswers } from "@/features/projects/local-projects";
import type { RoomType, WizardAnswers } from "@/features/projects/types";

export default function WizardPage() {
  const router = useRouter();
  const [scopeItems, setScopeItems] = useState<string[]>(["paint"]);

  function toggleScope(scopeId: string) {
    setScopeItems((currentScope) =>
      currentScope.includes(scopeId)
        ? currentScope.filter((item) => item !== scopeId)
        : [...currentScope, scopeId],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const answers: WizardAnswers = {
      roomType: form.get("roomType") as RoomType,
      roomSize: form.get("roomSize") as WizardAnswers["roomSize"],
      renovationGoal: form.get("renovationGoal") as WizardAnswers["renovationGoal"],
      budgetRange: form.get("budgetRange") as WizardAnswers["budgetRange"],
      priority: form.get("priority") as WizardAnswers["priority"],
      scopeItems,
      notes: String(form.get("notes") ?? ""),
    };

    updateWizardAnswers(answers);
    router.push("/results");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Step 3
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Renovation planning wizard
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        Answer a few practical questions to create a local mock estimate.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Room type</span>
          <select
            name="roomType"
            defaultValue="kitchen"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="kitchen">Kitchen</option>
            <option value="bathroom">Bathroom</option>
            <option value="living-room">Living room</option>
            <option value="bedroom">Bedroom</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Room size</span>
          <select
            name="roomSize"
            defaultValue="medium"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Goal</span>
          <select
            name="renovationGoal"
            defaultValue="cosmetic-refresh"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="cosmetic-refresh">Cosmetic refresh</option>
            <option value="functional-upgrade">Functional upgrade</option>
            <option value="resale-prep">Resale prep</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Budget range</span>
          <select
            name="budgetRange"
            defaultValue="5000-15000"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="under-5000">Under $5,000</option>
            <option value="5000-15000">$5,000 to $15,000</option>
            <option value="15000-30000">$15,000 to $30,000</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Top priority</span>
          <select
            name="priority"
            defaultValue="cost"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="cost">Cost</option>
            <option value="speed">Speed</option>
            <option value="durability">Durability</option>
            <option value="appearance">Appearance</option>
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-zinc-900">Scope</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {scopeOptions.map((scope) => (
              <label key={scope.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={scopeItems.includes(scope.id)}
                  onChange={() => toggleScope(scope.id)}
                />
                {scope.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Notes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Anything to keep, avoid, or prioritize?"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          Generate results
        </button>
      </form>
    </main>
  );
}
