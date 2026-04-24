import {
  createSavedProject,
  listSavedProjects,
} from "@/lib/server/projects/prisma-projects";
import type { ProjectSession } from "@/features/projects/types";

export const runtime = "nodejs";

type SaveProjectRequest = {
  project?: ProjectSession;
};

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

export async function GET(request: Request) {
  const ownerToken = getOwnerToken(request);

  if (!ownerToken) {
    return jsonError("Owner token is required.", 400);
  }

  try {
    const projects = await listSavedProjects(ownerToken);
    return Response.json({ ok: true, projects });
  } catch (error) {
    console.error("[api/projects]", error);
    return jsonError("Saved projects could not be loaded.", 500);
  }
}

export async function POST(request: Request) {
  const ownerToken = getOwnerToken(request);

  if (!ownerToken) {
    return jsonError("Owner token is required.", 400);
  }

  let body: SaveProjectRequest;

  try {
    body = (await request.json()) as SaveProjectRequest;
  } catch {
    return jsonError("Send the saved project payload as JSON.", 400);
  }

  if (!body.project || typeof body.project !== "object") {
    return jsonError("Saved project payload is required.", 400);
  }

  try {
    const project = await createSavedProject({
      ownerToken,
      project: body.project,
    });

    return Response.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    console.error("[api/projects]", error);
    return jsonError("The project could not be saved.", 500);
  }
}
