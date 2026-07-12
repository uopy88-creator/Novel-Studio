/**
 * =============================================================================
 * Sentence Assistant — 타입
 * -----------------------------------------------------------------------------
 * AI가 문장을 대신 쓰지 않는다.
 * 작가가 표현을 고를 수 있도록 참고 정보만 제공하는 도구의 골격.
 * =============================================================================
 */

export type SentenceAssistantTabId = "word" | "expression" | "show-tell";

export interface SentenceAssistantTab {
  id: SentenceAssistantTabId;
  label: string;
  icon: string;
}

export const SENTENCE_ASSISTANT_TABS: SentenceAssistantTab[] = [
  { id: "word", label: "단어", icon: "📖" },
  { id: "expression", label: "표현 바꾸기", icon: "✍" },
  { id: "show-tell", label: "Show / Tell", icon: "👁" },
];

export interface SentenceSelection {
  text: string;
  start: number;
  end: number;
}
