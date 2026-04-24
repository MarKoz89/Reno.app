import { getSavedProjectByPublicId } from "@/lib/server/projects/repository";

export const runtime = "nodejs";

function getOwnerToken(request: Request) {
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
  context: { params: Promise<{ publicId: string }> },
) {
  const ownerToken = getOwnerToken(request);

  if (!ownerToken) {
    return jsonError("Owner token is required.", 400);
  }

  const { publicId } = await context.params;

  try {
    const project = await getSavedProjectByPublicId({
      ownerToken,
      publicId,
    });

    if (!project) {
      return jsonError("Project not found.", 404);
    }

    return Response.json({ ok: true, project });
  } catch (error) {
    console.error("[api/projects/[publicId]]", error);
    return jsonError("Saved project could not be loaded.", 500);
  }
}
