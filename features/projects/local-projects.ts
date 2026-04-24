import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import { renovationStyles } from "@/data/renovation-styles";
import type {
  ProjectSession,
  UploadedRoomImage,
  WizardAnswers,
} from "@/features/projects/types";

const draftKey = "reno-app:draft-project";
const projectsKey = "reno-app:saved-projects";
const ownerTokenKey = "reno-app:owner-token";
const projectStorageEvent = "reno-app:project-storage-changed";
let cachedDraftRaw: string | null = null;
let cachedDraftProject: ProjectSession | null = null;
let cachedSavedProjectsRaw: string | null = null;
let cachedSavedProjects: ProjectSession[] = [];
let cachedMockProject: ProjectSession | null = null;
let cachedProjectsForDisplay: ProjectSession[] | null = null;

export type ProjectStorageErrorCode = "quota-exceeded" | "unavailable";

export class ProjectStorageError extends Error {
  constructor(public readonly code: ProjectStorageErrorCode) {
    super(code);
    this.name = "ProjectStorageError";
  }
}

export function isProjectStorageError(
  error: unknown,
): error is ProjectStorageError {
  return error instanceof ProjectStorageError;
}

function isQuotaExceededError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

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
    [...images].reverse().find(
      (image) => image.previewDataUrl || image.redesignDataUrl,
    ) ??
    images[images.length - 1];

  return activeImage ? [activeImage] : [];
}

function normalizeProjectSession(project: ProjectSession): ProjectSession {
  return {
    ...project,
    uploadedImages: normalizeUploadedImages(project.uploadedImages),
  };
}

function mergeWizardAnswers(
  current: ProjectSession["wizardAnswers"],
  incoming: ProjectSession["wizardAnswers"],
) {
  const roomType = incoming?.roomType ?? current?.roomType;

  if (!roomType) {
    return undefined;
  }

  return {
    roomType,
    roomSizeM2: incoming?.roomSizeM2 ?? current?.roomSizeM2,
    renovationScope: incoming?.renovationScope ?? current?.renovationScope,
    qualityLevel: incoming?.qualityLevel ?? current?.qualityLevel,
    materialPreferences:
      incoming?.materialPreferences ?? current?.materialPreferences,
    notes: incoming?.notes ?? current?.notes ?? "",
  };
}

function mergeProjectSession(
  current: ProjectSession | undefined,
  incoming: ProjectSession,
) {
  if (!current) {
    return normalizeProjectSession(incoming);
  }

  return normalizeProjectSession({
    ...current,
    ...incoming,
    name: current.name || incoming.name,
    createdAt: current.createdAt || incoming.createdAt,
    uploadedImages:
      incoming.uploadedImages.length > 0
        ? incoming.uploadedImages
        : current.uploadedImages,
    selectedStyle: incoming.selectedStyle ?? current.selectedStyle,
    selectedRedesignVariant:
      incoming.selectedRedesignVariant ?? current.selectedRedesignVariant,
    wizardAnswers: mergeWizardAnswers(
      current.wizardAnswers,
      incoming.wizardAnswers,
    ),
    estimate: incoming.estimate ?? current.estimate,
  });
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

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new ProjectStorageError("quota-exceeded");
    }

    throw new ProjectStorageError("unavailable");
  }

  window.dispatchEvent(new Event(projectStorageEvent));
}

function mergeProjects(
  currentProjects: ProjectSession[],
  incomingProjects: ProjectSession[],
) {
  const mergedProjects = new Map<string, ProjectSession>();

  for (const project of currentProjects) {
    mergedProjects.set(project.id, project);
  }

  for (const project of incomingProjects) {
    mergedProjects.set(
      project.id,
      mergeProjectSession(mergedProjects.get(project.id), project),
    );
  }

  return Array.from(mergedProjects.values()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
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

export function resetDraftProject() {
  const draft = createDraftProject();
  writeJson(draftKey, draft);
  return draft;
}

export function saveDraftProject(project: ProjectSession) {
  writeJson(draftKey, normalizeProjectSession({ ...project, updatedAt: now() }));
}

export function ensureOwnerToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingToken = window.localStorage.getItem(ownerTokenKey);

  if (existingToken) {
    return existingToken;
  }

  const ownerToken = crypto.randomUUID();
  window.localStorage.setItem(ownerTokenKey, ownerToken);
  window.dispatchEvent(new Event(projectStorageEvent));
  return ownerToken;
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
  redesignDataUrl,
}: {
  fileName: string;
  label: string;
  previewDataUrl: string;
  redesignDataUrl: string;
}) {
  const draft = ensureDraftProject();
  const image: UploadedRoomImage = {
    id: createId("image"),
    fileName,
    label,
    addedAt: now(),
    previewDataUrl,
    redesignDataUrl,
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

export function upsertSavedProject(project: ProjectSession) {
  const nextProjects = mergeProjects(getSavedProjects(), [project]);
  writeJson(projectsKey, nextProjects);
  return project;
}

export function mergeSavedProjects(projects: ProjectSession[]) {
  const nextProjects = mergeProjects(getSavedProjects(), projects);
  writeJson(projectsKey, nextProjects);
  return nextProjects;
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
      materialPreferences: "Light tile, matte fixtures, and easy-clean painted walls.",
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
