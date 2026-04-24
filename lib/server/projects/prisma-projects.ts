import type {
  ProjectSession,
  RenovationEstimate,
  RenovationScope,
  RoomType,
} from "@/features/projects/types";
import { getPrisma } from "@/lib/prisma";

export type SaveProjectInput = {
  user_email?: string | null;
  room_type?: string | null;
  renovation_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
};

type StoredProjectRecord = {
  id: string;
  user_email: string | null;
  room_type: string | null;
  renovation_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: Date | null;
};

const roomTypes = new Set<RoomType>([
  "bathroom",
  "bedroom",
  "kitchen",
  "living-room",
]);

const renovationScopes = new Set<RenovationScope>([
  "full",
  "light",
  "standard",
]);

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? new Date().toISOString();
}

function getProjectName(roomType: string | null) {
  return roomType ? `${roomType.replaceAll("-", " ")} renovation plan` : "Saved renovation plan";
}

function isRoomType(value: string | null): value is RoomType {
  return value !== null && roomTypes.has(value as RoomType);
}

function isRenovationScope(value: string | null): value is RenovationScope {
  return value !== null && renovationScopes.has(value as RenovationScope);
}

function buildEstimate(project: StoredProjectRecord): RenovationEstimate | undefined {
  if (project.budget_min == null || project.budget_max == null) {
    return undefined;
  }

  const lowTotal = project.budget_min;
  const highTotal = project.budget_max;
  const midTotal = Math.round((lowTotal + highTotal) / 2);

  return {
    engineVersion: "v1",
    lowTotal,
    midTotal,
    highTotal,
    lineItems: [],
    assumptions: [],
    exclusions: [],
    confidenceScore: 0,
    confidenceReasons: [],
  };
}

function mapStoredProjectToSession(project: StoredProjectRecord): ProjectSession {
  const roomType = isRoomType(project.room_type) ? project.room_type : undefined;
  const renovationScope = isRenovationScope(project.renovation_type)
    ? project.renovation_type
    : undefined;
  const createdAt = toIsoString(project.created_at);

  return {
    id: project.id,
    name: getProjectName(project.room_type),
    status: "saved",
    createdAt,
    updatedAt: createdAt,
    uploadedImages: [],
    estimate: buildEstimate(project),
    wizardAnswers: roomType
      ? {
          roomType,
          renovationScope,
          notes: "",
        }
      : undefined,
  };
}

function normalizeString(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function normalizeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

export async function createSavedProject(project: SaveProjectInput) {
  const prisma = getPrisma();
  const createdProject = await prisma.projects.create({
    data: {
      user_email: normalizeString(project.user_email),
      room_type: normalizeString(project.room_type),
      renovation_type: normalizeString(project.renovation_type),
      budget_min: normalizeNumber(project.budget_min),
      budget_max: normalizeNumber(project.budget_max),
    },
  });

  return {
    id: createdProject.id,
    user_email: createdProject.user_email,
    room_type: createdProject.room_type,
    renovation_type: createdProject.renovation_type,
    budget_min: createdProject.budget_min,
    budget_max: createdProject.budget_max,
    created_at: toIsoString(createdProject.created_at),
  };
}

export async function listSavedProjects(userEmail: string) {
  const prisma = getPrisma();
  const projects = await prisma.projects.findMany({
    where: {
      user_email: userEmail,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return projects.map(mapStoredProjectToSession);
}

export async function getSavedProjectById({
  userEmail,
  projectId,
}: {
  userEmail: string;
  projectId: string;
}) {
  const prisma = getPrisma();
  const project = await prisma.projects.findFirst({
    where: {
      id: projectId,
      user_email: userEmail,
    },
  });

  return project ? mapStoredProjectToSession(project) : null;
}
