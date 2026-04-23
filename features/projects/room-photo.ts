export const maxUploadBytes = 4 * 1024 * 1024;

const maxStoredImageDimension = 1600;
const maxStoredImageBytes = 900 * 1024;
const initialJpegQuality = 0.82;
const minJpegQuality = 0.55;
const jpegQualityStep = 0.09;
const maxResizePasses = 4;

export const allowedRoomImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type RoomPhotoErrorCode =
  | "unsupported-type"
  | "file-too-large"
  | "read-failed"
  | "decode-failed";

export class RoomPhotoError extends Error {
  constructor(public readonly code: RoomPhotoErrorCode) {
    super(code);
    this.name = "RoomPhotoError";
  }
}

export function isRoomPhotoError(error: unknown): error is RoomPhotoError {
  return error instanceof RoomPhotoError;
}

function getDataUrlBytes(dataUrl: string) {
  const base64Payload = dataUrl.split(",", 2)[1] ?? "";
  const padding = base64Payload.endsWith("==")
    ? 2
    : base64Payload.endsWith("=")
      ? 1
      : 0;

  return Math.floor((base64Payload.length * 3) / 4) - padding;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new RoomPhotoError("decode-failed"));
    };

    image.src = objectUrl;
  });
}

function getScaledDimensions(width: number, height: number, scale: number) {
  const longestSide = Math.max(width, height);
  const dimensionScale =
    longestSide > maxStoredImageDimension
      ? maxStoredImageDimension / longestSide
      : 1;
  const finalScale = Math.min(1, scale * dimensionScale);

  return {
    width: Math.max(1, Math.round(width * finalScale)),
    height: Math.max(1, Math.round(height * finalScale)),
  };
}

export async function createRoomPhotoPreviewDataUrl(file: File) {
  if (!allowedRoomImageTypes.has(file.type)) {
    throw new RoomPhotoError("unsupported-type");
  }

  if (file.size > maxUploadBytes) {
    throw new RoomPhotoError("file-too-large");
  }

  let image: HTMLImageElement;

  try {
    image = await loadImageFromFile(file);
  } catch (error) {
    if (isRoomPhotoError(error)) {
      throw error;
    }

    throw new RoomPhotoError("read-failed");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new RoomPhotoError("read-failed");
  }

  let resizeScale = 1;

  for (let resizePass = 0; resizePass < maxResizePasses; resizePass += 1) {
    const { width, height } = getScaledDimensions(
      image.naturalWidth,
      image.naturalHeight,
      resizeScale,
    );

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (
      let quality = initialJpegQuality;
      quality >= minJpegQuality;
      quality -= jpegQualityStep
    ) {
      const previewDataUrl = canvas.toDataURL("image/jpeg", quality);

      if (getDataUrlBytes(previewDataUrl) <= maxStoredImageBytes) {
        return previewDataUrl;
      }
    }

    resizeScale *= 0.82;
  }

  return canvas.toDataURL("image/jpeg", minJpegQuality);
}
