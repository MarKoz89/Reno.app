"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMockRoomImage,
  ensureDraftProject,
  getDraftProject,
} from "@/features/projects/local-projects";
import type { ProjectSession } from "@/features/projects/types";

export default function UploadPage() {
  const router = useRouter();
  const [project, setProject] = useState<ProjectSession | null>(null);

  useEffect(() => {
    setProject(ensureDraftProject());
  }, []);

  function handleAddRoomPhoto() {
    setProject(addMockRoomImage("Room photo"));
  }

  function handleContinue() {
    const draft = getDraftProject() ?? ensureDraftProject();

    if (draft.uploadedImages.length === 0) {
      setProject(addMockRoomImage("Room photo"));
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
        Add a mock room photo to start the local renovation planning flow.
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-6">
        <p className="text-sm font-medium text-zinc-900">
          {project?.uploadedImages.length ?? 0} mock photo saved in this draft
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          This uses browser storage only. No file is uploaded anywhere.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAddRoomPhoto}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Add mock photo
          </button>
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
