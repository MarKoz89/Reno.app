"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  syncSavedProjectFromBackend,
  syncSavedProjectsFromBackend,
} from "@/features/projects/backend-projects";
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
  const projects = useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectsForDisplay,
    () => emptyProjects,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void syncSavedProjectsFromBackend().finally(() => {
      if (!isCancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return { isLoading, projects };
}

export function useProjectForDisplay(projectId: string | null) {
  const project = useSyncExternalStore(
    subscribeToProjectStorage,
    () => (projectId ? getProjectForDisplayById(projectId) : null),
    () => null,
  );
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || projectId === "sample-project") {
      return;
    }

    let isCancelled = false;

    void syncSavedProjectFromBackend(projectId).finally(() => {
      if (!isCancelled) {
        setLoadedProjectId(projectId);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  const isLoading = Boolean(
    projectId &&
      projectId !== "sample-project" &&
      loadedProjectId !== projectId &&
      !project,
  );

  return { isLoading, project };
}
