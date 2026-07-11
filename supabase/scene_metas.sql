-- =============================================================================
-- scene_metas — Scene 상태·메모 (원고 본문과 분리)
-- =============================================================================
-- 원고(export)에는 들어가지 않습니다.
-- scene_number 는 직렬화 후 #1, #2 … 번호와 같습니다.
-- =============================================================================

create table if not exists public.scene_metas (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  -- Manuscript 안 #N 과 동일한 1부터 시작하는 번호
  scene_number integer not null,
  -- draft | editing | done
  status text not null default 'draft',
  -- 작가만 보는 메모 (export 제외)
  memo text not null default '',
  -- Navigator 접힘 여부
  is_collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, scene_number, user_id)
);

create index if not exists scene_metas_user_id_idx on public.scene_metas (user_id);
create index if not exists scene_metas_document_id_idx on public.scene_metas (document_id);
create index if not exists scene_metas_project_id_idx on public.scene_metas (project_id);

alter table public.scene_metas enable row level security;

drop policy if exists "scene_metas_select_own" on public.scene_metas;
drop policy if exists "scene_metas_insert_own" on public.scene_metas;
drop policy if exists "scene_metas_update_own" on public.scene_metas;
drop policy if exists "scene_metas_delete_own" on public.scene_metas;

create policy "scene_metas_select_own"
  on public.scene_metas for select using (auth.uid() = user_id);
create policy "scene_metas_insert_own"
  on public.scene_metas for insert with check (auth.uid() = user_id);
create policy "scene_metas_update_own"
  on public.scene_metas for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scene_metas_delete_own"
  on public.scene_metas for delete using (auth.uid() = user_id);
