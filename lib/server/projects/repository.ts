import { calculateEstimate } from "@/features/estimation/calculate-estimate";
import type {
  ProjectImageKind,
  ProjectSession,
  QualityLevel,
  RedesignVariant,
  RenovationScope,
  RoomType,
  UploadedRoomImage,
} from "@/features/projects/types";
import { renovationStyles } from "@/data/renovation-styles";
import { getSql } from "@/lib/server/db/client";
import { uploadProjectImageToBlob } from "@/lib/server/storage/blob";

type ProjectRow = {
  created_at: Date | string;
  estimate_engine_version: string;
  estimate_snapshot: unknown;
  id: string;
  material_preferences: string | null;
  name: string;
  notes: string | null;
  owner_token: string;
  public_id: string;
  quality_level: string | null;
  renovation_scope: string | null;
  room_size_m2: number | string | null;
  room_type: string | null;
  selected_redesign_snapshot: unknown;
  selected_style_id: string | null;
  status: string;
  updated_at: Date | string;
};

type ProjectImageRow = {
  blob_key: string;
  blob_url: string;
  byte_size: number | null;
  created_at: Date | string;
  file_name: string | null;
  id: string;
  kind: ProjectImageKind;
  mime_type: string;
  project_id: string;
};

function parseJsonField<T>(value: unknown): T | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }

  return value as T;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function generatePublicId() {
  return `prj_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

function getSelectedStyle(selectedStyleId: string | null) {
  return selectedStyleId
    ? renovationStyles.find((style) => style.id === selectedStyleId)
    : undefined;
}

function mapProjectImages(imageRows: ProjectImageRow[]) {
  const uploadedImage: UploadedRoomImage = {
    id: imageRows[0]?.id ?? crypto.randomUUID(),
    fileName: imageRows[0]?.file_name ?? "room-photo.jpg",
    label: "Room photo",
    addedAt: toIsoString(imageRows[0]?.created_at ?? new Date().toISOString()),
  };

  for (const imageRow of imageRows) {
    if (imageRow.kind === "preview") {
      uploadedImage.previewDataUrl = imageRow.blob_url;
    }

    if (imageRow.kind === "redesign_source") {
      uploadedImage.redesignDataUrl = imageRow.blob_url;
    }
  }

  return uploadedImage.previewDataUrl || uploadedImage.redesignDataUrl
    ? [uploadedImage]
    : [];
}

function mapProjectRowToSession(
  row: ProjectRow,
  imageRows: ProjectImageRow[],
): ProjectSession {
  const selectedRedesignSnapshot = parseJsonField<RedesignVariant>(
    row.selected_redesign_snapshot,
  );
  const estimateSnapshot = parseJsonField<ProjectSession["estimate"]>(
    row.estimate_snapshot,
  );

  return {
    id: row.public_id,
    name: row.name,
    status: row.status === "draft" ? "draft" : "saved",
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    uploadedImages: mapProjectImages(imageRows),
    selectedStyle: getSelectedStyle(row.selected_style_id),
    selectedRedesignVariant: selectedRedesignSnapshot,
    wizardAnswers: row.room_type
      ? {
          roomType: row.room_type as RoomType,
          roomSizeM2:
            row.room_size_m2 == null ? undefined : Number(row.room_size_m2),
          renovationScope:
            row.renovation_scope == null
              ? undefined
              : (row.renovation_scope as RenovationScope),
          qualityLevel:
            row.quality_level == null
              ? undefined
              : (row.quality_level as QualityLevel),
          materialPreferences: row.material_preferences ?? "",
          notes: row.notes ?? "",
        }
      : undefined,
    estimate: estimateSnapshot,
  };
}

async function getProjectImages(projectId: string) {
  const sql = getSql();

  return (await sql`
    select
      id,
      project_id,
      kind,
      blob_key,
      blob_url,
      mime_type,
      byte_size,
      file_name,
      created_at
    from project_images
    where project_id = ${projectId}
    order by created_at asc
  `) as ProjectImageRow[];
}

async function uploadProjectAssets({
  project,
  publicId,
}: {
  project: ProjectSession;
  publicId: string;
}) {
  const uploadedImages = project.uploadedImages[0];
  const imageAssets: Array<ProjectImageRow> = [];

  if (uploadedImages?.previewDataUrl) {
    const previewBlob = await uploadProjectImageToBlob({
      kind: "preview",
      projectPublicId: publicId,
      fileName: uploadedImages.fileName,
      sourceUrl: uploadedImages.previewDataUrl,
    });

    imageAssets.push({
      id: crypto.randomUUID(),
      project_id: "",
      kind: "preview",
      blob_key: previewBlob.blobKey,
      blob_url: previewBlob.url,
      mime_type: previewBlob.mimeType,
      byte_size: previewBlob.byteSize,
      file_name: previewBlob.fileName,
      created_at: new Date().toISOString(),
    });
  }

  if (uploadedImages?.redesignDataUrl) {
    const redesignBlob = await uploadProjectImageToBlob({
      kind: "redesign_source",
      projectPublicId: publicId,
      fileName: uploadedImages.fileName,
      sourceUrl: uploadedImages.redesignDataUrl,
    });

    imageAssets.push({
      id: crypto.randomUUID(),
      project_id: "",
      kind: "redesign_source",
      blob_key: redesignBlob.blobKey,
      blob_url: redesignBlob.url,
      mime_type: redesignBlob.mimeType,
      byte_size: redesignBlob.byteSize,
      file_name: redesignBlob.fileName,
      created_at: new Date().toISOString(),
    });
  }

  let selectedRedesignSnapshot = project.selectedRedesignVariant;

  if (project.selectedRedesignVariant?.imageUrl) {
    const redesignVariantBlob = await uploadProjectImageToBlob({
      kind: "selected_redesign",
      projectPublicId: publicId,
      fileName: `${project.selectedRedesignVariant.id}.png`,
      sourceUrl: project.selectedRedesignVariant.imageUrl,
    });

    imageAssets.push({
      id: crypto.randomUUID(),
      project_id: "",
      kind: "selected_redesign",
      blob_key: redesignVariantBlob.blobKey,
      blob_url: redesignVariantBlob.url,
      mime_type: redesignVariantBlob.mimeType,
      byte_size: redesignVariantBlob.byteSize,
      file_name: redesignVariantBlob.fileName,
      created_at: new Date().toISOString(),
    });

    selectedRedesignSnapshot = {
      ...project.selectedRedesignVariant,
      imageUrl: redesignVariantBlob.url,
    };
  }

  return {
    imageAssets,
    selectedRedesignSnapshot,
  };
}

export async function createSavedProject({
  ownerToken,
  project,
}: {
  ownerToken: string;
  project: ProjectSession;
}) {
  const sql = getSql();
  const publicId = generatePublicId();
  const estimateSnapshot = calculateEstimate(project);
  const { imageAssets, selectedRedesignSnapshot } = await uploadProjectAssets({
    project,
    publicId,
  });
  const projectId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await sql.transaction((transactionSql) => [
    transactionSql`
      insert into projects (
        id,
        public_id,
        owner_token,
        name,
        status,
        selected_style_id,
        room_type,
        room_size_m2,
        renovation_scope,
        quality_level,
        material_preferences,
        notes,
        estimate_engine_version,
        estimate_snapshot,
        selected_redesign_snapshot,
        created_at,
        updated_at
      ) values (
        ${projectId},
        ${publicId},
        ${ownerToken},
        ${project.name},
        ${"saved"},
        ${project.selectedStyle?.id ?? null},
        ${project.wizardAnswers?.roomType ?? null},
        ${project.wizardAnswers?.roomSizeM2 ?? null},
        ${project.wizardAnswers?.renovationScope ?? null},
        ${project.wizardAnswers?.qualityLevel ?? null},
        ${project.wizardAnswers?.materialPreferences ?? ""},
        ${project.wizardAnswers?.notes ?? ""},
        ${estimateSnapshot.engineVersion},
        ${JSON.stringify(estimateSnapshot)}::jsonb,
        ${selectedRedesignSnapshot
          ? JSON.stringify(selectedRedesignSnapshot)
          : null}::jsonb,
        ${timestamp},
        ${timestamp}
      )
    `,
    ...imageAssets.map((imageAsset) =>
      transactionSql`
        insert into project_images (
          id,
          project_id,
          kind,
          blob_key,
          blob_url,
          mime_type,
          byte_size,
          file_name,
          created_at
        ) values (
          ${imageAsset.id},
          ${projectId},
          ${imageAsset.kind},
          ${imageAsset.blob_key},
          ${imageAsset.blob_url},
          ${imageAsset.mime_type},
          ${imageAsset.byte_size},
          ${imageAsset.file_name},
          ${imageAsset.created_at}
        )
      `
    ),
  ]);

  const projectRow = (await sql`
    select
      id,
      public_id,
      owner_token,
      name,
      status,
      selected_style_id,
      room_type,
      room_size_m2,
      renovation_scope,
      quality_level,
      material_preferences,
      notes,
      estimate_engine_version,
      estimate_snapshot,
      selected_redesign_snapshot,
      created_at,
      updated_at
    from projects
    where id = ${projectId}
    limit 1
  `) as ProjectRow[];

  return mapProjectRowToSession(projectRow[0], imageAssets);
}

export async function listSavedProjects(ownerToken: string) {
  const sql = getSql();

  const projectRows = (await sql`
    select
      id,
      public_id,
      owner_token,
      name,
      status,
      selected_style_id,
      room_type,
      room_size_m2,
      renovation_scope,
      quality_level,
      material_preferences,
      notes,
      estimate_engine_version,
      estimate_snapshot,
      selected_redesign_snapshot,
      created_at,
      updated_at
    from projects
    where owner_token = ${ownerToken}
    order by updated_at desc
  `) as ProjectRow[];

  const imageMap = new Map<string, ProjectImageRow[]>();

  for (const row of projectRows) {
    imageMap.set(row.id, await getProjectImages(row.id));
  }

  return projectRows.map((row) =>
    mapProjectRowToSession(row, imageMap.get(row.id) ?? []),
  );
}

export async function getSavedProjectByPublicId({
  ownerToken,
  publicId,
}: {
  ownerToken: string;
  publicId: string;
}) {
  const sql = getSql();

  const projectRows = (await sql`
    select
      id,
      public_id,
      owner_token,
      name,
      status,
      selected_style_id,
      room_type,
      room_size_m2,
      renovation_scope,
      quality_level,
      material_preferences,
      notes,
      estimate_engine_version,
      estimate_snapshot,
      selected_redesign_snapshot,
      created_at,
      updated_at
    from projects
    where public_id = ${publicId}
      and owner_token = ${ownerToken}
    limit 1
  `) as ProjectRow[];

  const row = projectRows[0];

  if (!row) {
    return null;
  }

  const imageRows = await getProjectImages(row.id);
  return mapProjectRowToSession(row, imageRows);
}
