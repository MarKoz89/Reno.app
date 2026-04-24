import { getSavedProjectById } from "@/lib/server/projects/prisma-projects";

export const runtime = "nodejs";

function getProjectUserEmail(request: Request) {
  return request.headers.get("x-owner-token")?.trim() ?? "";
}

function jsonError(message: string, status: number) {
  return Response.json(
    {
      ok: false,
      error: {
        message,
      },
    },
    { status },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const userEmail = getProjectUserEmail(request);

  if (!userEmail) {
    return jsonError("User identifier is required.", 400);
  }

  const { projectId } = await context.params;

  try {
    const project = await getSavedProjectById({
      projectId,
      userEmail,
    });

    if (!project) {
      return jsonError("Project not found.", 404);
    }

    return Response.json({ ok: true, project });
  } catch (error) {
    console.error("[api/projects/[projectId]]", error);
    return jsonError("Saved project could not be loaded.", 500);
  }
}
