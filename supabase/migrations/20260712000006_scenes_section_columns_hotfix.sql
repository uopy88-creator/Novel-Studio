-- =============================================================================
-- APPLY ON SUPABASE DASHBOARD (SQL Editor) if Section save fails
-- -----------------------------------------------------------------------------
-- Root cause of "저장 실패 · 클라우드에 쓰지 못했습니다" on Manuscript load:
--   public.scenes was missing section_number + icons after Section refactor.
-- App code now falls back to legacy columns, but run this for full icon support.
--
-- Safe to re-run (IF NOT EXISTS / idempotent updates).
-- =============================================================================

-- 1) section_number (from 20260712000002_sections_rename.sql)
ALTER TABLE public.scenes
  ADD COLUMN IF NOT EXISTS section_number integer;

UPDATE public.scenes
SET section_number = scene_number
WHERE section_number IS NULL
  AND scene_number IS NOT NULL;

-- 2) icons (from 20260712000004_section_icons.sql)
ALTER TABLE public.scenes
  ADD COLUMN IF NOT EXISTS icons jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.scenes.section_number IS
  'Section display order (1-based). Preferred by app; scene_number kept for legacy.';

COMMENT ON COLUMN public.scenes.icons IS
  'Section display icons: { important, foreshadowing, dialogue } booleans.';
