import { renovationStyles } from "@/data/renovation-styles";
import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import type {
  ProjectSession,
  QualityLevel,
  RedesignVariant,
  RenovationScope,
  RoomType,
} from "@/features/projects/types";
import { Prisma } from "@/lib/generated/prisma";
import { getPrisma } from "@/lib/prisma";

type StoredProjectRecord = {
  id: string;
  public_id: string;
  owner_token: string;
  name: string;
  status: string;
  selected_style_id: string | null;
  room_type: string | null;
  room_size_m2: number | string | { toString(): string } | null;
  renovation_scope: string | null;
  quality_level: string | null;
  material_preferences: string | null;
  notes: string | null;
  estimate_engine_version: string;
  estimate_snapshot: unknown;
  selected_redesign_snapshot: unknown;
  created_at: Date;
  updated_at: Date;
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

const qualityLevels = new Set<QualityLevel>([
  "budget",
  "premium",
  "standard",
]);

function parseJsonField<T>(value: unknown): T | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
}

function toIsoString(value: Date | null | undefined) {
  return value?.toISOString() ?? new Date().toISOString();
}

function generatePublicId() {
  return `prj_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

function isRoomType(value: string | null): value is RoomType {
  return value !== null && roomTypes.has(value as RoomType);
}

function isRenovationScope(value: string | null): value is RenovationScope {
  return value !== null && renovationScopes.has(value as RenovationScope);
}

function isQualityLevel(value: string | null): value is QualityLevel {
  return value !== null && qualityLevels.has(value as QualityLevel);
}

function getSelectedStyle(selectedStyleId: string | null) {
  return selectedStyleId
    ? renovationStyles.find((style) => style.id === selectedStyleId)
    : undefined;
}

function sanitizeSelectedRedesignVariant(
  variant: ProjectSession["selectedRedesignVariant"],
) {
  if (!variant) {
    return undefined;
  }

  if (variant.imageUrl.startsWith("data:image/")) {
    return {
      ...variant,
      imageUrl: "",
    };
  }

  return variant;
}

function mapStoredProjectToSession(project: StoredProjectRecord): ProjectSession {
  const roomType = isRoomType(project.room_type) ? project.room_type : undefined;
  const renovationScope = isRenovationScope(project.renovation_scope)
    ? project.renovation_scope
    : undefined;
  const qualityLevel = isQualityLevel(project.quality_level)
    ? project.quality_level
    : undefined;
  const estimate = parseJsonField<ProjectSession["estimate"]>(
    project.estimate_snapshot,
  );
  const selectedRedesignVariant = parseJsonField<RedesignVariant>(
    project.selected_redesign_snapshot,
  );

  return {
    id: project.public_id,
    name: project.name,
    status: project.status === "draft" ? "draft" : "saved",
    createdAt: toIsoString(project.created_at),
    updatedAt: toIsoString(project.updated_at),
    uploadedImages: [],
    estimate,
    selectedStyle: getSelectedStyle(project.selected_style_id),
    selectedRedesignVariant:
      selectedRedesignVariant && selectedRedesignVariant.imageUrl
        ? selectedRedesignVariant
        : undefined,
    wizardAnswers: roomType
      ? {
          roomType,
          roomSizeM2:
            project.room_size_m2 == null
              ? undefined
              : Number(project.room_size_m2.toString()),
          renovationScope,
          qualityLevel,
          materialPreferences: project.material_preferences ?? "",
          notes: project.notes ?? "",
        }
      : undefined,
  };
}

export async function createSavedProject({
  ownerToken,
  project,
}: {
  ownerToken: string;
  project: ProjectSession;
}) {
  const prisma = getPrisma();
  const publicId = generatePublicId();
  const estimate = project.estimate ?? calculateEstimate(project);
  const selectedRedesignVariant = sanitizeSelectedRedesignVariant(
    project.selectedRedesignVariant,
  );
  const createdProject = await prisma.projects.create({
    data: {
      public_id: publicId,
      owner_token: ownerToken,
      name: project.name,
      status: "saved",
      selected_style_id: project.selectedStyle?.id ?? null,
      room_type: project.wizardAnswers?.roomType ?? null,
      room_size_m2: project.wizardAnswers?.roomSizeM2 ?? null,
      renovation_scope: project.wizardAnswers?.renovationScope ?? null,
      quality_level: project.wizardAnswers?.qualityLevel ?? null,
      material_preferences: project.wizardAnswers?.materialPreferences ?? "",
      notes: project.wizardAnswers?.notes ?? "",
      estimate_engine_version: estimate.engineVersion,
      estimate_snapshot: estimate,
      selected_redesign_snapshot: selectedRedesignVariant ?? Prisma.JsonNull,
    },
  });

  return {
    ...project,
    id: createdProject.public_id,
    status: "saved" as const,
    selectedRedesignVariant,
    createdAt: toIsoString(createdProject.created_at),
    updatedAt: toIsoString(createdProject.updated_at),
    estimate,
  };
}

export async function listSavedProjects(ownerToken: string) {
  const prisma = getPrisma();
  const projects = await prisma.projects.findMany({
    where: {
      owner_token: ownerToken,
    },
    orderBy: {
      updated_at: "desc",
    },
  });

  return projects.map(mapStoredProjectToSession);
}

export async function getSavedProjectByPublicId({
  ownerToken,
  publicId,
}: {
  ownerToken: string;
  publicId: string;
}) {
  const prisma = getPrisma();
  const project = await prisma.projects.findFirst({
    where: {
      public_id: publicId,
      owner_token: ownerToken,
    },
  });

  return project ? mapStoredProjectToSession(project) : null;
}
