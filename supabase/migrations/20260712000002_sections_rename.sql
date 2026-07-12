/**
 * =============================================================================
 * Migration: scenes table → Section-oriented columns
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript (documents row) → Sections (scenes metas)
 *
 * HOW TO RUN (Supabase CLI):
 *   cd <repo-root>
 *   npx supabase db push
 *   # or apply this file alone:
 *   psql "$DATABASE_URL" -f supabase/migrations/20260712000002_sections_rename.sql
 *
 * HOW TO RUN (Supabase Dashboard):
 *   SQL Editor → paste this file → Run
 *
 * Notes:
 * - Table name stays `scenes` (app DB_TABLES.section_metas / scene_metas both point here).
 * - Adds `section_number` mirrored from `scene_number` for new code.
 * - Keeps `document_id` (hidden Manuscript Document FK) — safer than project_id-only.
 * - App writes both scene_number and section_number; reads section_number ?? scene_number.
 * =============================================================================
 */

-- Add section_number alongside legacy scene_number
ALTER TABLE public.scenes
  ADD COLUMN IF NOT EXISTS section_number integer;

-- Backfill from scene_number where missing
UPDATE public.scenes
SET section_number = scene_number
WHERE section_number IS NULL
  AND scene_number IS NOT NULL;

-- Keep them in sync for rows that already have both
COMMENT ON COLUMN public.scenes.section_number IS
  'Section display order (1-based). Preferred by app; scene_number kept for legacy.';

COMMENT ON COLUMN public.scenes.scene_number IS
  'Legacy column — same meaning as section_number. Prefer section_number going forward.';

COMMENT ON TABLE public.scenes IS
  'Section metas (status/memo/collapse) for Project→Manuscript→Sections. Table name historical.';

-- Optional helper: trigger to keep scene_number ≈ section_number on write
CREATE OR REPLACE FUNCTION public.sync_section_number_from_scene()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.section_number IS NULL AND NEW.scene_number IS NOT NULL THEN
    NEW.section_number := NEW.scene_number;
  ELSIF NEW.scene_number IS NULL AND NEW.section_number IS NOT NULL THEN
    NEW.scene_number := NEW.section_number;
  ELSIF NEW.section_number IS DISTINCT FROM NEW.scene_number
        AND NEW.section_number IS NOT NULL THEN
    -- Prefer section_number when both set differently
    NEW.scene_number := NEW.section_number;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_section_number ON public.scenes;
CREATE TRIGGER trg_sync_section_number
  BEFORE INSERT OR UPDATE ON public.scenes
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_section_number_from_scene();
