"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  qualityLevelOptions,
  renovationScopeOptions,
} from "@/features/estimation/calculate-estimate";
import {
  ensureDraftProject,
  updateWizardAnswers,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import type {
  QualityLevel,
  RenovationScope,
  RoomType,
  WizardAnswers,
} from "@/features/projects/types";

export default function WizardPage() {
  const router = useRouter();
  const project = useDraftProject();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomSizeM2 = Number(form.get("roomSizeM2"));

    const answers: WizardAnswers = {
      roomType: form.get("roomType") as RoomType,
      roomSizeM2: Number.isFinite(roomSizeM2) && roomSizeM2 > 0 ? roomSizeM2 : undefined,
      renovationScope: form.get("renovationScope") as RenovationScope,
      qualityLevel: form.get("qualityLevel") as QualityLevel,
      notes: String(form.get("notes") ?? ""),
    };

    ensureDraftProject();
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
        Enter the core details needed for a deterministic v1 planning estimate.
      </p>
      {project?.selectedStyle ? (
        <p className="mt-3 text-sm text-zinc-500">
          Selected style: {project.selectedStyle.name}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Room type</span>
          <select
            name="roomType"
            defaultValue={project?.wizardAnswers?.roomType ?? "kitchen"}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="kitchen">Kitchen</option>
            <option value="bathroom">Bathroom</option>
            <option value="living-room">Living room</option>
            <option value="bedroom">Bedroom</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            Room size in square meters
          </span>
          <input
            name="roomSizeM2"
            type="number"
            min="1"
            step="0.5"
            defaultValue={project?.wizardAnswers?.roomSizeM2 ?? 12}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            Renovation scope
          </span>
          <select
            name="renovationScope"
            defaultValue={project?.wizardAnswers?.renovationScope ?? "standard"}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            {renovationScopeOptions.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.label}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-sm text-zinc-500">
            Light is cosmetic, standard is a typical refresh, full is broader trade-heavy work.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            Quality level
          </span>
          <select
            name="qualityLevel"
            defaultValue={project?.wizardAnswers?.qualityLevel ?? "standard"}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            {qualityLevelOptions.map((quality) => (
              <option key={quality.id} value={quality.id}>
                {quality.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">Notes</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={project?.wizardAnswers?.notes ?? ""}
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
