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

type CreatedProjectResponse =
  | {
      ok: true;
      project: {
        id: string;
        user_email: string | null;
        room_type: string | null;
        renovation_type: string | null;
        budget_min: number | null;
        budget_max: number | null;
        created_at: string;
      };
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

  return {
    project: {
      user_email: ensureOwnerToken(),
      room_type: project.wizardAnswers?.roomType ?? null,
      renovation_type: project.wizardAnswers?.renovationScope ?? null,
      budget_min: estimate.lowTotal,
      budget_max: estimate.highTotal,
    },
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
  const estimate = draft.estimate ?? calculateEstimate(draft);
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getOwnerHeaders(),
    },
    body: JSON.stringify(buildProjectSavePayload(draft)),
  });
  const data = await readResponse<CreatedProjectResponse>(response);

  if (!response.ok || !data.ok) {
    throw new Error(
      "error" in data
        ? data.error?.message ?? "The project could not be saved."
        : "The project could not be saved.",
    );
  }

  const savedProject: ProjectSession = {
    ...draft,
    id: data.project.id,
    status: "saved",
    createdAt: data.project.created_at,
    updatedAt: data.project.created_at,
    estimate,
  };

  upsertSavedProject(savedProject);
  resetDraftProject();

  return savedProject;
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
