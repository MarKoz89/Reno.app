"use client";

import { useRouter } from "next/navigation";
import { renovationStyles } from "@/data/renovation-styles";
import {
  ensureDraftProject,
  updateDraftProject,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

export default function StylePage() {
  const router = useRouter();
  const project = useDraftProject();
  const { language } = usePreferences();
  const text = getDictionary(language);

  function handleSelectStyle(styleId: string) {
    const selectedStyle = renovationStyles.find((style) => style.id === styleId);

    if (!selectedStyle) {
      return;
    }

    ensureDraftProject();
    updateDraftProject({
      selectedStyle,
      selectedRedesignVariant: undefined,
    });
    router.push("/wizard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.common.step(2)}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {text.style.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        {text.style.body}
      </p>
      {project?.uploadedImages[0] ? (
        <p className="mt-3 text-sm text-zinc-500">
          {text.style.photoAdded}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {renovationStyles.map((style) => (
          (() => {
            const styleText =
              text.style.styles[style.id as keyof typeof text.style.styles];

            return (
              <button
                type="button"
                key={style.id}
                onClick={() => handleSelectStyle(style.id)}
                className="rounded-lg border border-zinc-200 p-5 text-left transition hover:border-zinc-400"
              >
                <h2 className="text-lg font-semibold text-zinc-950">
                  {styleText.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {styleText.description}
                </p>
              </button>
            );
          })()
        ))}
      </div>
    </main>
  );
}
