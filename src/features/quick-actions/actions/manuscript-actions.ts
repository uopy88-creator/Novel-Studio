/**
 * =============================================================================
 * Manuscript 용 Action 팩토리
 * -----------------------------------------------------------------------------
 * 페이지 콜백을 주입받아 QuickAction 객체를 만든다.
 * Registry 에 register 하면 Quick Actions 버튼이 자동 생성된다.
 * =============================================================================
 */

import type {
  QuickAction,
  QuickActionSelection,
} from "@/features/quick-actions/types";

/** Sentence Assistant 열기 */
export function createSentenceAssistantAction(options: {
  openAssistant: (selection: QuickActionSelection) => void;
}): QuickAction {
  return {
    id: "sentence-assistant",
    label: "Sentence Assistant",
    icon: "🪄",
    priority: 10,
    isAvailable: (ctx) => Boolean(ctx.selection.text.trim()),
    execute: (ctx) => {
      options.openAssistant(ctx.selection);
    },
  };
}

/** Inspiration 저장 (영감 추가 모달) */
export function createInspirationSaveAction(options: {
  saveInspiration: (selection: QuickActionSelection) => void;
}): QuickAction {
  return {
    id: "inspiration-save",
    label: "Inspiration 저장",
    icon: "💡",
    priority: 20,
    isAvailable: (ctx) => Boolean(ctx.selection.text.trim()),
    execute: (ctx) => {
      options.saveInspiration(ctx.selection);
    },
  };
}

/** Memo 만들기 — 선택 텍스트를 본문에 미리 채움 */
export function createMemoSaveAction(options: {
  openMemo: (selection: QuickActionSelection) => void;
}): QuickAction {
  return {
    id: "memo-save",
    label: "Memo 만들기",
    icon: "📝",
    priority: 30,
    isAvailable: (ctx) => Boolean(ctx.selection.text.trim()),
    execute: (ctx) => {
      options.openMemo(ctx.selection);
    },
  };
}

/**
 * Highlight — 선택 구간 하늘색(#BFE8FF) 토글.
 * 색상 팔레트 없음. Selection Action Menu 전용.
 */
export function createHighlightAction(options: {
  toggleHighlight: (selection: QuickActionSelection) => void;
}): QuickAction {
  return {
    id: "highlight",
    label: "Highlight",
    icon: "🖍",
    priority: 40,
    isAvailable: (ctx) => Boolean(ctx.selection.text.trim()),
    execute: (ctx) => {
      options.toggleHighlight(ctx.selection);
    },
  };
}
