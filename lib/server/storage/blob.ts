import { put } from "@vercel/blob";
import type { ProjectImageKind } from "@/features/projects/types";

type UploadedBlobAsset = {
  blobKey: string;
  byteSize: number;
  fileName: string;
  mimeType: string;
  url: string;
};

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function parseDataUrl(dataUrl: string) {
  const [header, base64] = dataUrl.split(",", 2);

  if (!header || !base64) {
    throw new Error("Invalid data URL.");
  }

  const mimeMatch = header.match(/^data:(.*?);base64$/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
  const buffer = Buffer.from(base64, "base64");

  return {
    byteSize: buffer.byteLength,
    mimeType,
    payload: new Blob([buffer], { type: mimeType }),
  };
}

async function readSourcePayload(sourceUrl: string) {
  if (sourceUrl.startsWith("data:")) {
    return parseDataUrl(sourceUrl);
  }

  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Could not fetch asset source: ${response.status}`);
  }

  const blob = await response.blob();

  return {
    byteSize: blob.size,
    mimeType: blob.type || "application/octet-stream",
    payload: blob,
  };
}

function getFileExtension(mimeType: string, fallbackName: string) {
  const knownExtension = mimeType === "image/png"
    ? "png"
    : mimeType === "image/webp"
      ? "webp"
      : mimeType === "image/jpeg"
        ? "jpg"
        : "";

  if (knownExtension) {
    return knownExtension;
  }

  const fileNameExtension = fallbackName.split(".").pop()?.toLowerCase();
  return fileNameExtension && fileNameExtension !== fallbackName.toLowerCase()
    ? fileNameExtension
    : "bin";
}

export async function uploadProjectImageToBlob({
  kind,
  projectPublicId,
  fileName,
  sourceUrl,
}: {
  kind: ProjectImageKind;
  projectPublicId: string;
  fileName: string;
  sourceUrl: string;
}): Promise<UploadedBlobAsset> {
  const { byteSize, mimeType, payload } = await readSourcePayload(sourceUrl);
  const extension = getFileExtension(mimeType, fileName);
  const blobKey = `projects/${projectPublicId}/${kind}-${crypto.randomUUID()}.${extension}`;
  const token = getBlobToken();

  const uploaded = await put(blobKey, payload, {
    access: "public",
    addRandomSuffix: false,
    contentType: mimeType,
    token,
  });

  return {
    blobKey: uploaded.pathname,
    byteSize,
    fileName,
    mimeType,
    url: uploaded.url,
  };
}
