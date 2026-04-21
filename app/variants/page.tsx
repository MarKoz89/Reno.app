"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ensureDraftProject, updateDraftProject } from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import type { RedesignVariant } from "@/features/projects/types";

type RedesignStatus = "idle" | "loading" | "ready" | "error";

type RedesignResponse =
  | {
      ok: true;
      variants: RedesignVariant[];
      meta: {
        styleId: string;
        styleName: string;
      };
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fileName, {
    type: blob.type || "image/png",
  });
}

export default function VariantsPage() {
  const router = useRouter();
  const project = useDraftProject();
  const selectedStyle = project?.selectedStyle;
  const selectedVariantId = project?.selectedRedesignVariant?.id;
  const sourceImage = project?.uploadedImages[0];
  const sourceImageDataUrl = sourceImage?.previewDataUrl;
  const sourceImageFileName = sourceImage?.fileName ?? "room-photo.png";
  const selectedStyleId = selectedStyle?.id;
  const selectedStyleName = selectedStyle?.name;
  const [status, setStatus] = useState<RedesignStatus>("idle");
  const [variants, setVariants] = useState<RedesignVariant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateVariants = useCallback(
    async (signal: AbortSignal) => {
      if (!selectedStyleId || !selectedStyleName) {
        setStatus("idle");
        setVariants([]);
        return;
      }

      if (!sourceImageDataUrl) {
        setStatus("error");
        setVariants([]);
        setErrorMessage("Add a room photo before generating redesign ideas.");
        return;
      }

      setStatus("loading");
      setErrorMessage(null);
      setVariants([]);

      try {
        const imageFile = await dataUrlToFile(
          sourceImageDataUrl,
          sourceImageFileName,
        );
        const formData = new FormData();
        formData.set("image", imageFile);
        formData.set("styleId", selectedStyleId);
        formData.set("count", "3");

        const response = await fetch("/api/redesign", {
          method: "POST",
          body: formData,
          signal,
        });
        const data = (await response.json()) as RedesignResponse;

        if (!response.ok || !data.ok) {
          throw new Error(
            !data.ok
              ? data.error?.message
              : "Could not generate redesign options.",
          );
        }

        const generatedVariants = data.variants.slice(0, 3);

        setVariants(generatedVariants);
        setStatus(generatedVariants.length > 0 ? "ready" : "error");

        if (generatedVariants.length === 0) {
          setErrorMessage("No redesign options were generated.");
        }
      } catch (error) {
        if (!signal.aborted) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not generate redesign options.",
          );
        }
      }
    },
    [selectedStyleId, selectedStyleName, sourceImageDataUrl, sourceImageFileName],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void generateVariants(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [generateVariants]);

  function handleSelectVariant(variant: RedesignVariant) {
    ensureDraftProject();
    updateDraftProject({ selectedRedesignVariant: variant });
  }

  function handleContinue() {
    if (!project?.selectedRedesignVariant) {
      return;
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
        Generate AI redesign options from your current room photo and pick one for inspiration. This does not affect the estimate.
      </p>
      {selectedStyle ? (
        <p className="mt-3 text-sm text-zinc-500">
          Based on your selected style: {selectedStyle.name}
        </p>
      ) : null}

      {status === "loading" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-zinc-200 p-5"
            >
              <div className="aspect-[4/3] rounded-md bg-zinc-100" />
              <p className="mt-4 text-sm font-medium text-zinc-900">
                Generating redesign option...
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                This can take a moment.
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-8 rounded-lg border border-zinc-200 p-6">
          <p className="text-sm font-medium text-zinc-950">
            Redesign generation is not available.
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {errorMessage ?? "Could not generate redesign options."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Back to upload
          </button>
        </div>
      ) : null}

      {status === "ready" ? (
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
                  aria-label={`${variant.title} AI redesign preview`}
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
                    AI-generated inspiration
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!project?.selectedRedesignVariant}
          className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
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
