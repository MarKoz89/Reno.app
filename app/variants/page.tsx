"use client";

import { useRouter } from "next/navigation";
import { getMockRedesignVariants } from "@/data/mock-redesign-variants";
import { ensureDraftProject, updateDraftProject } from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import type { RedesignVariant } from "@/features/projects/types";

export default function VariantsPage() {
  const router = useRouter();
  const project = useDraftProject();
  const selectedStyle = project?.selectedStyle;
  const variants = getMockRedesignVariants(selectedStyle?.id);
  const selectedVariantId = project?.selectedRedesignVariant?.id;

  function handleSelectVariant(variant: RedesignVariant) {
    ensureDraftProject();
    updateDraftProject({ selectedRedesignVariant: variant });
  }

  function handleContinue() {
    if (!project?.selectedRedesignVariant) {
      updateDraftProject({ selectedRedesignVariant: variants[0] });
    }

    router.push("/wizard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Step 3
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Choose a design direction
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Pick one local mock redesign direction for inspiration. This does not affect the estimate.
      </p>
      {selectedStyle ? (
        <p className="mt-3 text-sm text-zinc-500">
          Based on your selected style: {selectedStyle.name}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;

          return (
            <button
              type="button"
              key={variant.id}
              onClick={() => handleSelectVariant(variant)}
              className={`overflow-hidden rounded-lg border text-left transition ${
                isSelected
                  ? "border-zinc-950 ring-2 ring-zinc-950"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <div
                aria-label={`${variant.title} mock preview`}
                className="aspect-[4/3] w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url(${variant.imageUrl})` }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      {variant.styleLabel}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                      {variant.title}
                    </h2>
                  </div>
                  {isSelected ? (
                    <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-medium text-white">
                      Preferred
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {variant.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Mock preview, not AI generated
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white"
        >
          Continue to wizard
        </button>
        <button
          type="button"
          onClick={() => router.push("/style")}
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          Back to styles
        </button>
      </div>
    </main>
  );
}
