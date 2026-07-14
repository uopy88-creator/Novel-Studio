/**
 * Quick Actions — 공개 진입점
 *
 * 사용:
 * 1) createActionRegistry + register(Action)
 * 2) createActionEngine(registry)
 * 3) <QuickActions engine={engine} textareaRef={...} />
 *
 * 새 Action 은 Registry.register 만 — QuickActions / Engine 수정 금지.
 */

export type {
  QuickAction,
  QuickActionContext,
  QuickActionSelection,
} from "@/features/quick-actions/types";

export {
  ActionRegistry,
  createActionRegistry,
} from "@/features/quick-actions/registry/ActionRegistry";

export {
  ActionEngine,
  createActionEngine,
} from "@/features/quick-actions/engine/ActionEngine";

export { QuickActions } from "@/features/quick-actions/components/QuickActions";
export type { QuickActionsProps } from "@/features/quick-actions/components/QuickActions";

export { MobileQuickActionsBar } from "@/features/quick-actions/components/MobileQuickActionsBar";
export type { MobileQuickActionsBarProps } from "@/features/quick-actions/components/MobileQuickActionsBar";

export {
  createSentenceAssistantAction,
  createInspirationSaveAction,
  createMemoSaveAction,
  createHighlightAction,
} from "@/features/quick-actions/actions/manuscript-actions";
