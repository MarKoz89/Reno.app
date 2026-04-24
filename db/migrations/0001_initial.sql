create extension if not exists pgcrypto;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  owner_token text not null,
  name text not null,
  status text not null default 'saved',
  selected_style_id text,
  room_type text,
  room_size_m2 numeric,
  renovation_scope text,
  quality_level text,
  material_preferences text,
  notes text,
  estimate_engine_version text not null,
  estimate_snapshot jsonb not null,
  selected_redesign_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_token_updated_at_idx
  on projects (owner_token, updated_at desc);

create table if not exists project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null check (kind in ('preview', 'redesign_source', 'selected_redesign')),
  blob_key text not null unique,
  blob_url text not null,
  mime_type text not null,
  byte_size integer,
  file_name text,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_id_kind_idx
  on project_images (project_id, kind);
