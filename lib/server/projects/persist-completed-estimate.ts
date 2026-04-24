import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import type { ProjectSession } from "@/features/projects/types";
import { Prisma } from "@/lib/generated/prisma";
import { getPrisma } from "@/lib/prisma";

function generatePublicId() {
  return `prj_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

export async function persistCompletedEstimate(project: ProjectSession) {
  const estimate = calculateEstimate(project);
  const prisma = getPrisma();
  const publicId = generatePublicId();

  const createdProject = await prisma.projects.create({
    data: {
      public_id: publicId,
      owner_token: `estimate-${crypto.randomUUID()}`,
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
      selected_redesign_snapshot:
        project.selectedRedesignVariant ?? Prisma.JsonNull,
    },
  });

  return {
    estimateId: null,
    projectId: createdProject.id,
    publicId: createdProject.public_id,
  };
}
