import type { ProjectSession } from "@/features/projects/types";
import { persistCompletedEstimate } from "@/lib/server/projects/persist-completed-estimate";

export const runtime = "nodejs";

type PersistEstimateRequest = {
  project?: ProjectSession;
};

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

export async function POST(request: Request) {
  let body: PersistEstimateRequest;

  try {
    body = (await request.json()) as PersistEstimateRequest;
  } catch {
    return jsonError("Send the completed estimate payload as JSON.", 400);
  }

  if (!body.project || typeof body.project !== "object") {
    return jsonError("Completed estimate payload is required.", 400);
  }

  try {
    const saved = await persistCompletedEstimate(body.project);

    return Response.json({ ok: true, saved }, { status: 201 });
  } catch (error) {
    console.error("[api/estimates]", error);
    return jsonError("Completed estimate persistence failed.", 500);
  }
}
