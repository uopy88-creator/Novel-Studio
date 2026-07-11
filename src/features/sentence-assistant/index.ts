/**
 * Sentence Assistant — 공개 진입점
 * (문장 생성 AI가 아니라, 표현 참고용 UI 골격)
 */

export { SentenceAssistantHost } from "./components/SentenceAssistantHost";
export { SentenceAssistantPanel } from "./components/SentenceAssistantPanel";
export type { SentenceAssistantHostProps } from "./components/SentenceAssistantHost";
export type { SentenceAssistantPanelProps } from "./components/SentenceAssistantPanel";
export {
  SENTENCE_ASSISTANT_TABS,
  type SentenceAssistantTabId,
  type SentenceSelection,
} from "./types";
