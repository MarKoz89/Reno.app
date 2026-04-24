import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import type { ProjectSession } from "@/features/projects/types";
import { getPrisma } from "@/lib/prisma";

export async function persistCompletedEstimate(project: ProjectSession) {
  const estimate = calculateEstimate(project);
  const prisma = getPrisma();

  const createdProject = await prisma.projects.create({
    data: {
      room_type: project.wizardAnswers?.roomType ?? null,
      renovation_type: project.wizardAnswers?.renovationScope ?? null,
      budget_min: estimate.lowTotal,
      budget_max: estimate.highTotal,
    },
  });

  return {
    estimateId: null,
    projectId: createdProject.id,
  };
}
