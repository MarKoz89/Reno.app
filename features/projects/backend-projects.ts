"use client";

import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import type { ProjectSession } from "@/features/projects/types";
import {
  ensureDraftProject,
  ensureOwnerToken,
  mergeSavedProjects,
  resetDraftProject,
  saveProjectFromDraft,
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

function buildProjectSavePayload(project: ProjectSession) {
  const estimate = project.estimate ?? calculateEstimate(project);
  const selectedRedesignVariant = project.selectedRedesignVariant?.imageUrl.startsWith(
    "data:image/",
  )
    ? undefined
    : project.selectedRedesignVariant;

  return {
    project: {
      name: project.name,
      status: project.status,
      selectedStyle: project.selectedStyle,
      selectedRedesignVariant,
      wizardAnswers: project.wizardAnswers,
      estimate,
      uploadedImages: [],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      id: project.id,
    } satisfies ProjectSession,
  };
}

async function persistCompletedEstimate(project: ProjectSession) {
  try {
    const response = await fetch("/api/estimates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project,
      }),
      keepalive: true,
    });

    if (!response.ok) {
      console.error("[projects] estimate persistence failed", await response.text());
    }
  } catch (error) {
    console.error("[projects] estimate persistence failed", error);
  }
}

export function saveCompletedEstimate() {
  const savedProject = saveProjectFromDraft();

  // The local save remains primary; the database write is a safe secondary action.
  void persistCompletedEstimate(savedProject);

  return savedProject;
}

export async function saveProjectFromDraftToBackend() {
  const draft = ensureDraftProject();
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getOwnerHeaders(),
    },
    body: JSON.stringify(buildProjectSavePayload(draft)),
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
