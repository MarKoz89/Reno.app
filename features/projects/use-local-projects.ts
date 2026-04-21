"use client";

import { useSyncExternalStore } from "react";
import {
  getDraftProject,
  getProjectForDisplayById,
  getProjectsForDisplay,
  subscribeToProjectStorage,
} from "@/features/projects/local-projects";
import type { ProjectSession } from "@/features/projects/types";

const emptyProjects: ProjectSession[] = [];

export function useDraftProject() {
  return useSyncExternalStore(
    subscribeToProjectStorage,
    getDraftProject,
    () => null,
  );
}

export function useProjectsForDisplay() {
  return useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectsForDisplay,
    () => emptyProjects,
  );
}

export function useProjectForDisplay(projectId: string) {
  return useSyncExternalStore(
    subscribeToProjectStorage,
    () => (projectId ? getProjectForDisplayById(projectId) : null),
    () => null,
  );
}
