"use client";

import { useRouter } from "next/navigation";
import { renovationStyles } from "@/data/renovation-styles";
import { updateDraftProject } from "@/features/projects/local-projects";

export default function StylePage() {
  const router = useRouter();

  function handleSelectStyle(styleId: string) {
    const selectedStyle = renovationStyles.find((style) => style.id === styleId);

    if (!selectedStyle) {
      return;
    }

    updateDraftProject({ selectedStyle });
    router.push("/wizard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Step 2
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Choose a renovation style
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Pick one simple direction for the project. This stays local in the browser.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {renovationStyles.map((style) => (
          <button
            type="button"
            key={style.id}
            onClick={() => handleSelectStyle(style.id)}
            className="rounded-lg border border-zinc-200 p-5 text-left transition hover:border-zinc-400"
          >
            <h2 className="text-lg font-semibold text-zinc-950">{style.name}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {style.description}
            </p>
          </button>
        ))}
      </div>
    </main>
  );
}
