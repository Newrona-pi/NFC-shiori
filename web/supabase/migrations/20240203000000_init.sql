-- Enable RLS
alter table auth.users enable row level security;

-- Create storage bucket 'audios' (private)
insert into storage.buckets (id, name, public) 
values ('audios', 'audios', false)
on conflict (id) do nothing;

-- TAGS Table
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  display_name text,
  uid_hex text unique,
  latest_audio_id uuid, -- Reference to audios(id) set by trigger
  last_ctr bigint default 0,
  last_ctr_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

-- AUDIOS Table
create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id) on delete cascade,
  storage_path text not null,
  title text,
  duration_ms int,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.audios enable row level security;

create index if not exists audios_tag_created_idx on public.audios(tag_id, created_at desc);

-- TAP EVENTS Table
create table if not exists public.tap_events (
  id bigserial primary key,
  tag_id uuid not null references public.tags(id) on delete cascade,
  uid_hex text not null,
  ctr bigint not null,
  ip_hash text,
  created_at timestamptz not null default now()
);

alter table public.tap_events enable row level security;

-- TRIGGER: Update tags.latest_audio_id
create or replace function public.set_latest_audio() returns trigger
language plpgsql security definer as $$
begin
  update public.tags set latest_audio_id = new.id where id = new.tag_id;
  return new;
end $$;

drop trigger if exists trg_set_latest_audio on public.audios;
create trigger trg_set_latest_audio
after insert on public.audios
for each row execute function public.set_latest_audio();

-- RLS POLICIES

-- Tags: Owners only
create policy "Owners can view tags" on public.tags 
  for select using (auth.uid() = owner_user_id);

create policy "Owners can insert tags" on public.tags 
  for insert with check (auth.uid() = owner_user_id);

create policy "Owners can update tags" on public.tags 
  for update using (auth.uid() = owner_user_id);

create policy "Owners can delete tags" on public.tags 
  for delete using (auth.uid() = owner_user_id);

-- Audios: Owners only (via tag ownership)
create policy "Owners can view audios" on public.audios 
  for select using (
    exists (select 1 from public.tags where tags.id = audios.tag_id and tags.owner_user_id = auth.uid())
  );

create policy "Owners can insert audios" on public.audios 
  for insert with check (
    exists (select 1 from public.tags where tags.id = audios.tag_id and tags.owner_user_id = auth.uid())
  );

create policy "Owners can delete audios" on public.audios 
  for delete using (
    exists (select 1 from public.tags where tags.id = audios.tag_id and tags.owner_user_id = auth.uid())
  );

-- Tap Events: No public access, only service role (so no policies needed if default deny? No, "enable row level security" defaults to deny all for anon/auth if no policy exists).
-- Service role ignores RLS.
-- Owners might want to see logs?
create policy "Owners can view tap logs" on public.tap_events
  for select using (
     exists (select 1 from public.tags where tags.id = tap_events.tag_id and tags.owner_user_id = auth.uid())
  );

-- Storage Policies for 'audios' bucket
-- Allow authenticated uploads if they own the folder (tagId)
-- Folder structure: tags/{tagId}/{filename}
create policy "Owners can upload audio files" on storage.objects
  for insert with check (
    bucket_id = 'audios' and
    auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = 'tags' and
    exists (
       select 1 from public.tags 
       where tags.id::text = (storage.foldername(name))[2] 
       and tags.owner_user_id = auth.uid()
    )
  );

create policy "Owners can select audio files" on storage.objects
  for select using (
    bucket_id = 'audios' and
    auth.role() = 'authenticated' and
    (storage.foldername(name))[1] = 'tags' and
    exists (
       select 1 from public.tags 
       where tags.id::text = (storage.foldername(name))[2] 
       and tags.owner_user_id = auth.uid()
    )
  );
