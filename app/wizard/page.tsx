"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { renovationStyles } from "@/data/renovation-styles";
import {
  qualityLevelOptions,
  renovationScopeOptions,
} from "@/features/estimation/calculate-estimate";
import {
  ensureDraftProject,
  updateDraftProject,
  updateWizardAnswers,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import type {
  QualityLevel,
  RenovationScope,
  RoomType,
  WizardAnswers,
} from "@/features/projects/types";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

export default function WizardPage() {
  const router = useRouter();
  const project = useDraftProject();
  const { language } = usePreferences();
  const text = getDictionary(language);
  const hasRoomPhoto = Boolean(project?.uploadedImages[0]?.previewDataUrl);
  const selectedStyleText = project?.selectedStyle
    ? text.style.styles[project.selectedStyle.id as keyof typeof text.style.styles]
    : undefined;
  const materialPreferencesLabel =
    language === "cs" ? "Materialy a povrchy" : "Material preferences";
  const materialPreferencesPlaceholder =
    language === "cs"
      ? "Napriklad drevo, matne povrchy, svetla dlazba nebo cerne baterie."
      : "For example: warm wood, matte finishes, light tile, or black fixtures.";
  const continueToRedesignLabel =
    language === "cs" ? "Pokracovat k navrhu" : "Continue to redesign";
  const missingPhotoBody =
    language === "cs"
      ? "Nejdriv pridejte fotku mistnosti, aby slo navazat na dalsi kroky planu."
      : "Add a room photo first so the rest of the planning flow has the right room context.";
  const missingStyleBody =
    language === "cs"
      ? "Nejdriv vyberte styl rekonstrukce, potom doplnte detaily projektu."
      : "Choose a renovation style first, then add the rest of the project details.";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomSizeM2 = Number(form.get("roomSizeM2"));

    const answers: WizardAnswers = {
      roomType: form.get("roomType") as RoomType,
      roomSizeM2: Number.isFinite(roomSizeM2) && roomSizeM2 > 0 ? roomSizeM2 : undefined,
      renovationScope: form.get("renovationScope") as RenovationScope,
      qualityLevel: form.get("qualityLevel") as QualityLevel,
      materialPreferences: String(form.get("materialPreferences") ?? "").slice(
        0,
        300,
      ),
      notes: String(form.get("notes") ?? ""),
    };

    ensureDraftProject();
    updateWizardAnswers(answers);
    router.push("/variants");
  }

  if (!hasRoomPhoto) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.common.step(3)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {text.wizard.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          {missingPhotoBody}
        </p>
        <Link
          href="/upload"
          className="mt-6 inline-flex w-fit rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.common.backToUpload}
        </Link>
      </main>
    );
  }

  if (!project?.selectedStyle) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {text.common.step(3)}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {text.wizard.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          {missingStyleBody}
        </p>
        <Link
          href="/style"
          className="mt-6 inline-flex w-fit rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {text.common.backToStyles}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.common.step(3)}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {text.wizard.title}
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        {text.wizard.body}
      </p>
      {selectedStyleText ? (
        <p className="mt-3 text-sm text-zinc-500">
          {text.wizard.selectedStyle(selectedStyleText.name)}
        </p>
      ) : null}

      <div className="mt-6 rounded-lg border border-zinc-200 p-5">
        <h2 className="text-base font-semibold text-zinc-950">
          {language === "cs" ? "Vybrany styl" : "Selected style"}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {renovationStyles.map((style) => {
            const styleText =
              text.style.styles[style.id as keyof typeof text.style.styles];
            const isSelected = project.selectedStyle?.id === style.id;

            return (
              <button
                type="button"
                key={style.id}
                onClick={() =>
                  updateDraftProject({
                    selectedStyle: style,
                    selectedRedesignVariant: undefined,
                  })
                }
                className={`rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? "border-zinc-950 ring-1 ring-zinc-950"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <h3 className="text-sm font-semibold text-zinc-950">
                  {styleText.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {styleText.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            {text.wizard.roomType}
          </span>
          <select
            name="roomType"
            defaultValue={project?.wizardAnswers?.roomType ?? "kitchen"}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            <option value="kitchen">{text.wizard.roomTypes.kitchen}</option>
            <option value="bathroom">{text.wizard.roomTypes.bathroom}</option>
            <option value="living-room">
              {text.wizard.roomTypes["living-room"]}
            </option>
            <option value="bedroom">{text.wizard.roomTypes.bedroom}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            {text.wizard.roomSize}
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
            {text.wizard.renovationScope}
          </span>
          <select
            name="renovationScope"
            defaultValue={project?.wizardAnswers?.renovationScope ?? "standard"}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            {renovationScopeOptions.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {text.wizard.scopeOptions[scope.id]}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-sm text-zinc-500">
            {text.wizard.scopeHelp}
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            {text.wizard.qualityLevel}
          </span>
          <select
            name="qualityLevel"
            defaultValue={project?.wizardAnswers?.qualityLevel ?? "standard"}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          >
            {qualityLevelOptions.map((quality) => (
              <option key={quality.id} value={quality.id}>
                {text.wizard.qualityOptions[quality.id]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            {materialPreferencesLabel}
          </span>
          <textarea
            name="materialPreferences"
            rows={3}
            defaultValue={project?.wizardAnswers?.materialPreferences ?? ""}
            placeholder={materialPreferencesPlaceholder}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-900">
            {text.wizard.notes}
          </span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={project?.wizardAnswers?.notes ?? ""}
            placeholder={text.wizard.notesPlaceholder}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          {continueToRedesignLabel}
        </button>
      </form>
    </main>
  );
}
