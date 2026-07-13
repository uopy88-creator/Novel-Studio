/**
 * =============================================================================
 * Show / Tell — 타입
 * -----------------------------------------------------------------------------
 * 작법 이해용 분석 도구. 문장 생성·원고 수정·AI 작성은 하지 않는다.
 * =============================================================================
 */

export type ShowTellKind = "show" | "tell";

/** Tell → Show 작법 방향 */
export type ShowTellStyleId =
  | "action"
  | "expression"
  | "dialogue"
  | "setting";

export interface ShowTellStyleOption {
  id: ShowTellStyleId;
  label: string;
}

export const SHOW_TELL_STYLES: ShowTellStyleOption[] = [
  { id: "action", label: "행동" },
  { id: "expression", label: "표정" },
  { id: "dialogue", label: "대사" },
  { id: "setting", label: "배경 묘사" },
];

export interface ShowTellAnalysis {
  /** 정규화된 선택 문장 (표시용) */
  sentence: string;
  /** 판정: Show | Tell */
  kind: ShowTellKind;
}

/**
 * 독립 작법 예시 묶음.
 * 선택 문장을 고치지 않는다. AI가 문장을 만들지 않는다.
 */
export interface ShowTellExampleResult {
  style: ShowTellStyleId;
  /** 작법 방향 안내용 예시 (여러 개) */
  examples: string[];
}

export const SHOW_TELL_EMPTY_SELECTION =
  "문장 전체를 선택하면 Show / Tell 분석을 볼 수 있습니다.";

export const SHOW_TELL_DISCLAIMER =
  "참고용 작법 예시입니다.\n선택하신 문장을 고치지 않으며, 그대로 쓸 필요는 없습니다.";

export const SHOW_TELL_JUDGMENT_LABEL = "판정";
