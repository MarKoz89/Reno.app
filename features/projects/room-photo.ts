export const maxUploadBytes = 4 * 1024 * 1024;

const maxPreviewImageDimension = 1600;
const maxPreviewImageBytes = 900 * 1024;
const previewInitialJpegQuality = 0.82;
const previewMinJpegQuality = 0.55;
const previewJpegQualityStep = 0.09;
const maxRedesignImageDimension = 2048;
const maxRedesignImageBytes = 1600 * 1024;
const redesignInitialJpegQuality = 0.9;
const redesignMinJpegQuality = 0.72;
const redesignJpegQualityStep = 0.06;
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

export function getRoomPhotoDataUrlBytes(dataUrl: string) {
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

function getScaledDimensionsForMaxSide(
  width: number,
  height: number,
  scale: number,
  maxDimension: number,
) {
  const longestSide = Math.max(width, height);
  const dimensionScale =
    longestSide > maxDimension
      ? maxDimension / longestSide
      : 1;
  const finalScale = Math.min(1, scale * dimensionScale);

  return {
    width: Math.max(1, Math.round(width * finalScale)),
    height: Math.max(1, Math.round(height * finalScale)),
  };
}

type RoomPhotoStorageConfig = {
  maxBytes: number;
  maxDimension: number;
  initialQuality: number;
  minQuality: number;
  qualityStep: number;
};

async function loadRoomPhoto(file: File) {
  if (!allowedRoomImageTypes.has(file.type)) {
    throw new RoomPhotoError("unsupported-type");
  }

  if (file.size > maxUploadBytes) {
    throw new RoomPhotoError("file-too-large");
  }

  try {
    return await loadImageFromFile(file);
  } catch (error) {
    if (isRoomPhotoError(error)) {
      throw error;
    }

    throw new RoomPhotoError("read-failed");
  }
}

function createStoredRoomPhotoDataUrl(
  image: HTMLImageElement,
  {
    maxBytes,
    maxDimension,
    initialQuality,
    minQuality,
    qualityStep,
  }: RoomPhotoStorageConfig,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new RoomPhotoError("read-failed");
  }

  let resizeScale = 1;

  for (let resizePass = 0; resizePass < maxResizePasses; resizePass += 1) {
    const { width, height } = getScaledDimensionsForMaxSide(
      image.naturalWidth,
      image.naturalHeight,
      resizeScale,
      maxDimension,
    );

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (
      let quality = initialQuality;
      quality >= minQuality;
      quality -= qualityStep
    ) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      if (getRoomPhotoDataUrlBytes(dataUrl) <= maxBytes) {
        return dataUrl;
      }
    }

    resizeScale *= 0.82;
  }

  return canvas.toDataURL("image/jpeg", minQuality);
}

export async function createRoomPhotoPreviewDataUrl(file: File) {
  const image = await loadRoomPhoto(file);

  return createStoredRoomPhotoDataUrl(image, {
    maxBytes: maxPreviewImageBytes,
    maxDimension: maxPreviewImageDimension,
    initialQuality: previewInitialJpegQuality,
    minQuality: previewMinJpegQuality,
    qualityStep: previewJpegQualityStep,
  });
}

export async function createRoomPhotoStoredImages(file: File) {
  const image = await loadRoomPhoto(file);

  return {
    previewDataUrl: createStoredRoomPhotoDataUrl(image, {
      maxBytes: maxPreviewImageBytes,
      maxDimension: maxPreviewImageDimension,
      initialQuality: previewInitialJpegQuality,
      minQuality: previewMinJpegQuality,
      qualityStep: previewJpegQualityStep,
    }),
    redesignDataUrl: createStoredRoomPhotoDataUrl(image, {
      maxBytes: maxRedesignImageBytes,
      maxDimension: maxRedesignImageDimension,
      initialQuality: redesignInitialJpegQuality,
      minQuality: redesignMinJpegQuality,
      qualityStep: redesignJpegQualityStep,
    }),
  };
}
