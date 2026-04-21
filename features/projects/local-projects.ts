import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import { renovationStyles } from "@/data/renovation-styles";
import type {
  ProjectSession,
  UploadedRoomImage,
  WizardAnswers,
} from "@/features/projects/types";

const draftKey = "reno-app:draft-project";
const projectsKey = "reno-app:saved-projects";
const projectStorageEvent = "reno-app:project-storage-changed";
let cachedDraftRaw: string | null = null;
let cachedDraftProject: ProjectSession | null = null;
let cachedSavedProjectsRaw: string | null = null;
let cachedSavedProjects: ProjectSession[] = [];
let cachedMockProject: ProjectSession | null = null;
let cachedProjectsForDisplay: ProjectSession[] | null = null;

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUploadedImages(images: UploadedRoomImage[] | undefined) {
  if (!images?.length) {
    return [];
  }

  const activeImage =
    [...images].reverse().find((image) => image.previewDataUrl) ??
    images[images.length - 1];

  return activeImage ? [activeImage] : [];
}

function normalizeProjectSession(project: ProjectSession): ProjectSession {
  return {
    ...project,
    uploadedImages: normalizeUploadedImages(project.uploadedImages),
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(projectStorageEvent));
}

export function subscribeToProjectStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(projectStorageEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(projectStorageEvent, onStoreChange);
  };
}

export function createDraftProject(): ProjectSession {
  const timestamp = now();

  return {
    id: createId("project"),
    name: "Untitled renovation plan",
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    uploadedImages: [],
  };
}

export function getDraftProject() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawDraft = window.localStorage.getItem(draftKey);

  if (rawDraft === cachedDraftRaw) {
    return cachedDraftProject;
  }

  cachedDraftRaw = rawDraft;
  const parsedDraft = rawDraft
    ? readJson<ProjectSession | null>(draftKey, null)
    : null;
  cachedDraftProject = parsedDraft ? normalizeProjectSession(parsedDraft) : null;

  return cachedDraftProject;
}

export function ensureDraftProject() {
  const existingDraft = getDraftProject();

  if (existingDraft) {
    return existingDraft;
  }

  const draft = createDraftProject();
  writeJson(draftKey, draft);
  return draft;
}

export function saveDraftProject(project: ProjectSession) {
  writeJson(draftKey, normalizeProjectSession({ ...project, updatedAt: now() }));
}

export function addMockRoomImage(label: string) {
  const draft = ensureDraftProject();
  const image: UploadedRoomImage = {
    id: createId("image"),
    fileName: `${label.toLowerCase().replaceAll(" ", "-")}.jpg`,
    label,
    addedAt: now(),
  };

  const updatedDraft = {
    ...draft,
    uploadedImages: [image],
    selectedRedesignVariant: undefined,
    updatedAt: now(),
  };

  saveDraftProject(updatedDraft);
  return updatedDraft;
}

export function addLocalRoomImage({
  fileName,
  label,
  previewDataUrl,
}: {
  fileName: string;
  label: string;
  previewDataUrl: string;
}) {
  const draft = ensureDraftProject();
  const image: UploadedRoomImage = {
    id: createId("image"),
    fileName,
    label,
    addedAt: now(),
    previewDataUrl,
  };

  const updatedDraft = {
    ...draft,
    uploadedImages: [image],
    selectedRedesignVariant: undefined,
    updatedAt: now(),
  };

  saveDraftProject(updatedDraft);
  return updatedDraft;
}

export function updateDraftProject(updates: Partial<ProjectSession>) {
  const draft = ensureDraftProject();
  const updatedDraft = {
    ...draft,
    ...updates,
    uploadedImages: normalizeUploadedImages(
      updates.uploadedImages ?? draft.uploadedImages,
    ),
    updatedAt: now(),
  };

  saveDraftProject(updatedDraft);
  return updatedDraft;
}

export function updateWizardAnswers(answers: WizardAnswers) {
  return updateDraftProject({
    name: `${answers.roomType.replace("-", " ")} renovation plan`,
    wizardAnswers: answers,
  });
}

export function getSavedProjects() {
  if (typeof window === "undefined") {
    return [];
  }

  const rawProjects = window.localStorage.getItem(projectsKey);

  if (rawProjects === cachedSavedProjectsRaw) {
    return cachedSavedProjects;
  }

  cachedSavedProjectsRaw = rawProjects;
  cachedSavedProjects = rawProjects
    ? readJson<ProjectSession[]>(projectsKey, []).map(normalizeProjectSession)
    : [];
  cachedProjectsForDisplay = null;

  return cachedSavedProjects;
}

export function saveProjectFromDraft() {
  const draft = normalizeProjectSession(ensureDraftProject());
  const project: ProjectSession = {
    ...draft,
    status: "saved",
    estimate: calculateEstimate(draft),
    updatedAt: now(),
  };

  const existingProjects = getSavedProjects();
  const nextProjects = [
    project,
    ...existingProjects.filter((savedProject) => savedProject.id !== project.id),
  ];

  writeJson(projectsKey, nextProjects);
  writeJson(draftKey, createDraftProject());

  return project;
}

export function getProjectById(projectId: string) {
  return getSavedProjects().find((project) => project.id === projectId);
}

export function createMockProject(): ProjectSession {
  if (cachedMockProject) {
    return cachedMockProject;
  }

  const timestamp = now();
  const project: ProjectSession = {
    id: "sample-project",
    name: "Sample bathroom refresh",
    status: "saved",
    createdAt: timestamp,
    updatedAt: timestamp,
    uploadedImages: [
      {
        id: "sample-image",
        fileName: "sample-bathroom.jpg",
        label: "Bathroom photo",
        addedAt: timestamp,
      },
    ],
    selectedStyle: renovationStyles[1],
    wizardAnswers: {
      roomType: "bathroom",
      roomSizeM2: 8,
      renovationScope: "light",
      qualityLevel: "standard",
      notes: "Keep the layout, brighten the finishes, and avoid major plumbing work.",
    },
  };

  cachedMockProject = {
    ...project,
    estimate: calculateEstimate(project),
  };

  return cachedMockProject;
}

export function getProjectsForDisplay() {
  const savedProjects = getSavedProjects();

  if (savedProjects.length > 0) {
    return savedProjects;
  }

  if (!cachedProjectsForDisplay) {
    cachedProjectsForDisplay = [createMockProject()];
  }

  return cachedProjectsForDisplay;
}

export function getProjectForDisplayById(projectId: string) {
  if (projectId === "sample-project") {
    return createMockProject();
  }

  return getProjectById(projectId) ?? null;
}
