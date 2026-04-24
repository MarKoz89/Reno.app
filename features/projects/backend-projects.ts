"use client";

import type { ProjectSession } from "@/features/projects/types";
import {
  ensureDraftProject,
  ensureOwnerToken,
  mergeSavedProjects,
  resetDraftProject,
  upsertSavedProject,
} from "@/features/projects/local-projects";

type SavedProjectsResponse =
  | {
      ok: true;
      projects: ProjectSession[];
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

type SavedProjectResponse =
  | {
      ok: true;
      project: ProjectSession;
    }
  | {
      ok: false;
      error?: {
        message?: string;
      };
    };

function getOwnerHeaders() {
  return {
    "x-owner-token": ensureOwnerToken(),
  };
}

async function readResponse<T>(response: Response) {
  return (await response.json()) as T;
}

export async function saveProjectFromDraftToBackend() {
  const draft = ensureDraftProject();
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getOwnerHeaders(),
    },
    body: JSON.stringify({
      project: draft,
    }),
  });
  const data = await readResponse<SavedProjectResponse>(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      "error" in data
        ? data.error?.message ?? "The project could not be saved."
        : "The project could not be saved.",
    );
  }

  upsertSavedProject(data.project);
  resetDraftProject();

  return data.project;
}

export async function syncSavedProjectsFromBackend() {
  const response = await fetch("/api/projects", {
    method: "GET",
    headers: getOwnerHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return;
  }

  const data = await readResponse<SavedProjectsResponse>(response);

  if (!data.ok) {
    return;
  }

  mergeSavedProjects(data.projects);
}

export async function syncSavedProjectFromBackend(projectId: string) {
  if (!projectId || projectId === "sample-project") {
    return;
  }

  const response = await fetch(`/api/projects/${projectId}`, {
    method: "GET",
    headers: getOwnerHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return;
  }

  const data = await readResponse<SavedProjectResponse>(response);

  if (!data.ok) {
    return;
  }

  upsertSavedProject(data.project);
}
