/**
 * Writing Vault feature 공개 진입점 (폴더명 dialogue-vault 는 하위 호환).
 */
export {
  DialogueVaultPage,
  WritingVaultPage,
} from "./components/DialogueVaultPage";
export { DialogueCard } from "./components/DialogueCard";
export { DialogueList } from "./components/DialogueList";
export { DialogueModal } from "./components/DialogueModal";
export { DialogueSearchBar } from "./components/DialogueSearchBar";
export { DialogueDeleteDialog } from "./components/DialogueDeleteDialog";
export { WritingVaultTypeFilter } from "./components/WritingVaultTypeFilter";
export { WritingVaultReferenceFields } from "./components/WritingVaultReferenceFields";
export { useDialogues } from "./hooks/useDialogues";
export type {
  WritingVaultEntry,
  WritingVaultType,
  WritingVaultReference,
  Dialogue,
} from "./types/dialogue";
