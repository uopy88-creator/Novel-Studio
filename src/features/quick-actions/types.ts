/**
 * =============================================================================
 * Quick Actions — 공통 타입
 * -----------------------------------------------------------------------------
 * Manuscript 외 페이지에서도 재사용한다.
 * Action 구현은 이 인터페이스만 따르면 Registry 등록으로 UI에 자동 반영된다.
 * =============================================================================
 */

/** 텍스트 선택 범위 (textarea 오프셋 기준) */
export interface QuickActionSelection {
  text: string;
  start: number;
  end: number;
}

/** Action 실행 시 Engine 이 넘기는 컨텍스트 */
export interface QuickActionContext {
  selection: QuickActionSelection;
  textarea: HTMLTextAreaElement | null;
}

/**
 * 공통 Action 계약.
 * 새 Action 은 이 인터페이스를 구현한 뒤 Registry.register 만 하면 된다.
 */
export interface QuickAction {
  /** 고유 ID (예: sentence-assistant, inspiration-save) */
  id: string;
  /** 버튼 라벨 */
  label: string;
  /** 아이콘 (이모지 또는 짧은 문자) */
  icon: string;
  /**
   * 정렬 우선순위. 작을수록 앞.
   * 기본 100.
   */
  priority?: number;
  /** 현재 선택에서 이 Action 을 보여줄지 */
  isAvailable: (ctx: QuickActionContext) => boolean;
  /** 실제 동작 — UI 는 호출하지 않고 Engine 만 호출한다 */
  execute: (ctx: QuickActionContext) => void | Promise<void>;
}
