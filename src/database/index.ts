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
  type DbDialogueRow,
  type DbDocumentRow,
  type DbManuscriptRow,
  type DbProjectRow,
} from "./supabase/types";

export { canUseCloudDb, getCloudUserId } from "./supabase/cloud-mode";
