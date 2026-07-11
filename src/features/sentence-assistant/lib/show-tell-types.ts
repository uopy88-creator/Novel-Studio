/**
 * =============================================================================
 * Show / Tell — 타입
 * -----------------------------------------------------------------------------
 * 분석·참고 예시만 제공한다. 원고 수정·자동 적용·복사는 하지 않는다.
 * =============================================================================
 */

export type ShowTellKind = "show" | "tell";

/** 참고 예시 방식 */
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
  /** 정규화된 선택 문장 */
  sentence: string;
  kind: ShowTellKind;
}

export interface ShowTellExampleResult {
  style: ShowTellStyleId;
  /** 참고용 예시 1개 */
  example: string;
}

export const SHOW_TELL_EMPTY_SELECTION =
  "문장 전체를 선택하면 Show / Tell 분석을 볼 수 있습니다.";

export const SHOW_TELL_DISCLAIMER =
  "참고용 예시입니다.\n그대로 사용할 필요는 없습니다.";
