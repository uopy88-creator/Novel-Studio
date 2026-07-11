/**
 * Database 모듈 공개 진입점.
 */

export {
  createBrowserSupabaseClient,
  getSupabasePublicConfig,
} from "./supabase/client";
export type { SupabasePublicConfig } from "./supabase/client";

export {
  DB_TABLES,
  type DbCharacterRow,
  type DbDialogueRow,
  type DbDocumentRow,
  type DbForeshadowingRow,
  type DbInspirationRow,
  type DbManuscriptRow,
  type DbManuscriptVersionRow,
  type DbMemoRow,
  type DbProjectRow,
  type DbTimelineEventRow,
  type DbWordTreasuryRow,
} from "./supabase/types";

export {
  canUseCloudDb,
  getCloudUserId,
  isSupabaseDataMode,
  requireCloudDb,
  requireCloudUserId,
} from "./supabase/cloud-mode";
