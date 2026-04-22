"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ensureDraftProject,
  updateDraftProject,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import type { RedesignVariant } from "@/features/projects/types";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

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
        code?: string;
        message?: string;
        retryable?: boolean;
      };
    };

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], fileName, {
    type: blob.type || "image/png",
  });
}

function hasUsableVariantImage(variant: RedesignVariant) {
  return (
    variant.imageUrl.startsWith("data:image/") ||
    variant.imageUrl.startsWith("https://") ||
    variant.imageUrl.startsWith("http://")
  );
}

function getMappedText(value: string, map: Record<string, string>) {
  return map[value] ?? value;
}

function getRedesignErrorMessage(
  data: RedesignResponse,
  text: ReturnType<typeof getDictionary>,
) {
  if (data.ok) {
    return text.variants.unavailableFallback;
  }

  const code = data.error?.code;

  return code
    ? getMappedText(code, text.estimateDomain.apiErrors.redesign)
    : data.error?.message ?? text.variants.unavailableFallback;
}

export default function VariantsPage() {
  const router = useRouter();
  const project = useDraftProject();
  const { language } = usePreferences();
  const text = getDictionary(language);
  const selectedStyle = project?.selectedStyle;
  const selectedStyleText = selectedStyle
    ? text.style.styles[selectedStyle.id as keyof typeof text.style.styles]
    : undefined;
  const selectedVariantId = project?.selectedRedesignVariant?.id;
  const sourceImage = project?.uploadedImages[0];
  const sourceImageDataUrl = sourceImage?.previewDataUrl;
  const sourceImageFileName = sourceImage?.fileName ?? "room-photo.png";
  const selectedStyleId = selectedStyle?.id;
  const selectedStyleName = selectedStyle?.name;
  const missingPhotoMessage = text.variants.missingPhoto;
  const unavailableFallbackMessage = text.variants.unavailableFallback;
  const emptyVariantsMessage = text.variants.empty;
  const retryLabel = language === "cs" ? "Zkusit znovu" : "Try again";
  const [status, setStatus] = useState<RedesignStatus>("idle");
  const [variants, setVariants] = useState<RedesignVariant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      async function generateVariants(signal: AbortSignal) {
        if (!selectedStyleId || !selectedStyleName) {
          setStatus("idle");
          setVariants([]);
          setCanRetry(false);
          return;
        }

        if (!sourceImageDataUrl) {
          setStatus("error");
          setVariants([]);
          setErrorMessage(missingPhotoMessage);
          setCanRetry(false);
          return;
        }

        setStatus("loading");
        setErrorMessage(null);
        setCanRetry(false);
        setVariants([]);

        try {
          const imageFile = await dataUrlToFile(
            sourceImageDataUrl,
            sourceImageFileName,
          );
          const formData = new FormData();
          formData.set("image", imageFile);
          formData.set("styleId", selectedStyleId);
          formData.set("count", "1");

          const response = await fetch("/api/redesign", {
            method: "POST",
            body: formData,
            signal,
          });
          const data = (await response.json()) as RedesignResponse;

          if (!response.ok || !data.ok) {
            setStatus("error");
            setCanRetry(!data.ok ? Boolean(data.error?.retryable) : true);
            setErrorMessage(getRedesignErrorMessage(data, text));
            return;
          }

          const generatedVariants = Array.isArray(data.variants)
            ? data.variants.filter(hasUsableVariantImage).slice(0, 1)
            : [];

          setVariants(generatedVariants);
          setStatus(generatedVariants.length > 0 ? "ready" : "error");

          if (generatedVariants.length === 0) {
            setErrorMessage(emptyVariantsMessage);
            setCanRetry(true);
          }
        } catch (error) {
          if (!signal.aborted) {
            setStatus("error");
            setCanRetry(Boolean(sourceImageDataUrl && selectedStyleId));
            setErrorMessage(
              error instanceof Error
                ? error.message
                : unavailableFallbackMessage,
            );
          }
        }
      }

      void generateVariants(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    selectedStyleId,
    selectedStyleName,
    sourceImageDataUrl,
    sourceImageFileName,
    retryNonce,
    missingPhotoMessage,
    text,
    unavailableFallbackMessage,
    emptyVariantsMessage,
  ]);

  function handleSelectVariant(variant: RedesignVariant) {
    ensureDraftProject();
    updateDraftProject({ selectedRedesignVariant: variant });
  }

  useEffect(() => {
    if (status === "ready" && variants.length === 1 && !selectedVariantId) {
      handleSelectVariant(variants[0]);
    }
  }, [selectedVariantId, status, variants]);

  function handleRetry() {
    setRetryNonce((currentRetryNonce) => currentRetryNonce + 1);
  }

  function handleContinue() {
    if (!project?.selectedRedesignVariant) {
      return;
    }

    router.push("/wizard");
  }

  return (
    <>
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.common.step(3)}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {text.variants.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        {text.variants.body}
      </p>
      {selectedStyleText ? (
        <p className="mt-3 text-sm text-zinc-500">
          {text.variants.basedOnStyle(selectedStyleText.name)}
        </p>
      ) : null}

      {status === "loading" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-zinc-200 p-5"
            >
              <div className="aspect-[4/3] rounded-md bg-zinc-100" />
              <p className="mt-4 text-sm font-medium text-zinc-900">
                {text.variants.generating}
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                {text.variants.loadingNote}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-8 rounded-lg border border-zinc-200 p-6">
          <p className="text-sm font-medium text-zinc-950">
            {text.variants.unavailable}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {errorMessage ?? text.variants.unavailableFallback}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {canRetry ? (
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
              >
                {retryLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push("/upload")}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
            >
              {text.common.backToUpload}
            </button>
          </div>
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
                onClick={() => {
                  console.log("variant clicked", variant.id);
                  handleSelectVariant(variant);
                }}
                className={`touch-manipulation overflow-hidden rounded-lg border text-left transition active:scale-95 ${
                  isSelected
                    ? "border-zinc-950 ring-2 ring-black"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewImage(variant.imageUrl);
                  }}
                  className="cursor-zoom-in"
                >
                  <div
                    aria-label={text.variants.previewLabel(variant.title)}
                    className="aspect-[4/3] w-full bg-cover bg-center"
                    role="img"
                    style={{
                      backgroundImage: `url(${variant.imageUrl})`,
                      pointerEvents: "none",
                    }}
                  />
                </div>
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
                        {text.variants.preferred}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {variant.description}
                  </p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    {text.variants.inspiration}
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
          {text.variants.continue}
        </button>
        <button
          type="button"
          onClick={() => router.push("/style")}
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900"
        >
          {text.common.backToStyles}
        </button>
      </div>
    </main>
    {previewImage ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={() => setPreviewImage(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewImage}
          alt="Preview"
          className="max-h-[90%] max-w-[90%] rounded-lg"
        />
      </div>
    ) : null}
    </>
  );
}
