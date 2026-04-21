"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addLocalRoomImage,
  ensureDraftProject,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";
import { getDictionary } from "@/features/ui/dictionary";
import { usePreferences } from "@/features/ui/use-preferences";

const maxUploadBytes = 4 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image."));
      }
    });
    reader.addEventListener("error", () => reject(new Error("Could not read image.")));
    reader.readAsDataURL(file);
  });
}

export default function UploadPage() {
  const router = useRouter();
  const project = useDraftProject();
  const { language } = usePreferences();
  const text = getDictionary(language);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const hasActiveRoomPhoto = Boolean(project?.uploadedImages[0]?.previewDataUrl);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage(null);

    if (!allowedImageTypes.has(file.type)) {
      setErrorMessage(text.upload.errors.type);
      return;
    }

    if (file.size > maxUploadBytes) {
      setErrorMessage(text.upload.errors.size);
      return;
    }

    setIsReadingFile(true);

    try {
      const previewDataUrl = await readFileAsDataUrl(file);
      ensureDraftProject();
      addLocalRoomImage({
        fileName: file.name,
        label: "Room photo",
        previewDataUrl,
      });
    } catch {
      setErrorMessage(text.upload.errors.read);
    } finally {
      setIsReadingFile(false);
      event.target.value = "";
    }
  }

  function handleContinue() {
    const draft = project ?? ensureDraftProject();
    const hasRealImage = Boolean(draft.uploadedImages[0]?.previewDataUrl);

    if (!hasRealImage) {
      setErrorMessage(text.upload.errors.required);
      return;
    }

    router.push("/style");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {text.common.step(1)}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {text.upload.title}
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        {text.upload.body}
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6">
        <p className="text-sm font-medium text-zinc-900">
          {hasActiveRoomPhoto ? text.upload.selected : text.upload.empty}
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          {text.upload.storageNote}
        </p>
        {errorMessage ? (
          <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900">
            {isReadingFile
              ? text.upload.reading
              : hasActiveRoomPhoto
                ? text.upload.replace
                : text.upload.choose}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleImageUpload}
              disabled={isReadingFile}
            />
          </label>
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
          >
            {text.upload.continue}
          </button>
        </div>
      </div>
    </main>
  );
}
