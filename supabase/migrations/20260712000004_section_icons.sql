/**
 * =============================================================================
 * Migration: Section icons (중요 / 복선 / 대사)
 * -----------------------------------------------------------------------------
 * Architecture: Project → Manuscript → Sections
 *
 * Adds `icons` jsonb on `scenes` (section metas table) for Section page toggles.
 *
 * HOW TO RUN (Supabase CLI):
 *   npx supabase db push
 * =============================================================================
 */

ALTER TABLE public.scenes
  ADD COLUMN IF NOT EXISTS icons jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.scenes.icons IS
  'Section display icons: { important, foreshadowing, dialogue } booleans.';
