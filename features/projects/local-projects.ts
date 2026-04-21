import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import { renovationStyles } from "@/data/renovation-styles";
import type {
  ProjectSession,
  UploadedRoomImage,
  WizardAnswers,
} from "@/features/projects/types";

const draftKey = "reno-app:draft-project";
const projectsKey = "reno-app:saved-projects";

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
  return readJson<ProjectSession | null>(draftKey, null);
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
  writeJson(draftKey, { ...project, updatedAt: now() });
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
    uploadedImages: [...draft.uploadedImages, image],
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
  return readJson<ProjectSession[]>(projectsKey, []);
}

export function saveProjectFromDraft() {
  const draft = ensureDraftProject();
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
      roomSize: "small",
      renovationGoal: "cosmetic-refresh",
      budgetRange: "5000-15000",
      priority: "appearance",
      scopeItems: ["paint", "fixtures", "lighting"],
      notes: "Keep the layout, brighten the finishes, and avoid major plumbing work.",
    },
  };

  return {
    ...project,
    estimate: calculateEstimate(project),
  };
}

export function getProjectsForDisplay() {
  const savedProjects = getSavedProjects();

  if (savedProjects.length > 0) {
    return savedProjects;
  }

  return [createMockProject()];
}

