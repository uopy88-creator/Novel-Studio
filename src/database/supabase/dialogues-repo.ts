/**
 * =============================================================================
 * dialogues-repo — writing-vault-repo 재수출 (하위 호환 경로)
 * =============================================================================
 */

export {
  cloudListWritingVaultEntries as cloudListDialogues,
  cloudListWritingVaultByProject as cloudListDialoguesByProject,
  cloudUpsertWritingVaultEntry as cloudUpsertDialogue,
  cloudDeleteWritingVaultEntry as cloudDeleteDialogue,
} from "@/database/supabase/writing-vault-repo";
