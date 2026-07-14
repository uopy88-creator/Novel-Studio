/**
 * =============================================================================
 * Trash — Soft Delete 공개 API
 * -----------------------------------------------------------------------------
 * adapters 는 side-effect 로 등록된다.
 * =============================================================================
 */

import "@/features/trash/lib/trash-adapters";

export type {
  TrashEntityType,
  TrashItem,
} from "@/features/trash/types/trash-item";
export {
  TRASH_ENTITY_LABELS,
  TRASH_RETENTION_DAYS,
  computeExpiresAt,
} from "@/features/trash/types/trash-item";

export {
  softDelete,
  restore,
  permanentDelete,
  listTrash,
  clearTrashForProject,
  ensureTrashAdaptersRegistered,
  registerTrashAdapter,
} from "@/features/trash/lib/trash-manager";
export type {
  TrashCaptureResult,
  TrashEntityAdapter,
} from "@/features/trash/lib/trash-manager";

export { TrashPage } from "@/features/trash/components/TrashPage";
export type { TrashPageProps } from "@/features/trash/components/TrashPage";
