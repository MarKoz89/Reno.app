"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addLocalRoomImage,
  ensureDraftProject,
} from "@/features/projects/local-projects";
import { useDraftProject } from "@/features/projects/use-local-projects";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage(null);

    if (!allowedImageTypes.has(file.type)) {
      setErrorMessage("Use a JPG, PNG, or WebP room photo.");
      return;
    }

    if (file.size > maxUploadBytes) {
      setErrorMessage("Use a room photo smaller than 4 MB.");
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
      setErrorMessage("Could not read that image. Try a different room photo.");
    } finally {
      setIsReadingFile(false);
      event.target.value = "";
    }
  }

  function handleContinue() {
    const draft = project ?? ensureDraftProject();
    const hasRealImage = draft.uploadedImages.some((image) => image.previewDataUrl);

    if (!hasRealImage) {
      setErrorMessage("Upload a room photo before continuing.");
      return;
    }

    router.push("/style");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Step 1
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        Upload room photos
      </h1>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        Add one room photo so Reno App can generate redesign inspiration.
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6">
        <p className="text-sm font-medium text-zinc-900">
          {project?.uploadedImages.length ?? 0} room photo
          {(project?.uploadedImages.length ?? 0) === 1 ? "" : "s"} saved in this draft
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          The photo stays in browser storage until you generate redesign options.
        </p>
        {errorMessage ? (
          <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900">
            {isReadingFile ? "Adding photo..." : "Choose room photo"}
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
            Continue to style
          </button>
        </div>
      </div>
    </main>
  );
}
