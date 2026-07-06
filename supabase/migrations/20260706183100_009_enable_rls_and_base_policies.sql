alter table if exists public.projects enable row level security;
alter table if exists public.images enable row level security;
alter table if exists public.annotations enable row level security;
alter table if exists public.label_classes enable row level security;
alter table if exists public.workflows enable row level security;
alter table if exists public.public_datasets enable row level security;
alter table if exists public.dataset_likes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'Projects are readable'
  ) then
    create policy "Projects are readable" on public.projects
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'images' and policyname = 'Images are readable'
  ) then
    create policy "Images are readable" on public.images
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'annotations' and policyname = 'Annotations are readable'
  ) then
    create policy "Annotations are readable" on public.annotations
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'label_classes' and policyname = 'Classes are readable'
  ) then
    create policy "Classes are readable" on public.label_classes
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'workflows' and policyname = 'Workflows are readable'
  ) then
    create policy "Workflows are readable" on public.workflows
      for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'public_datasets' and policyname = 'Public datasets are readable'
  ) then
    create policy "Public datasets are readable" on public.public_datasets
      for select using (isPublic = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'dataset_likes' and policyname = 'Likes are readable'
  ) then
    create policy "Likes are readable" on public.dataset_likes
      for select using (true);
  end if;
end $$;
