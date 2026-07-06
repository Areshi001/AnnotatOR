alter table if exists public.images
  add column if not exists review_status text not null default 'pending',
  add column if not exists annotator_id uuid,
  add column if not exists reviewer_id uuid;

alter table if exists public.annotations
  add column if not exists created_by uuid,
  add column if not exists confidence double precision,
  add column if not exists notes text;

alter table if exists public.projects
  add column if not exists owner_id uuid;

alter table if exists public.public_datasets
  add column if not exists author_id uuid;

create index if not exists images_review_status_idx on public.images (review_status);
