/**
 * Sentence Assistant — 공개 진입점
 * (문장 생성 AI가 아니라, 표현 참고용 도구)
 *
 * 아키텍처: UI → Core Engine → Lemma / Dictionary / Synonym / ShowTell
 */

export { SentenceAssistantHost } from "./components/SentenceAssistantHost";
export { SentenceAssistantPanel } from "./components/SentenceAssistantPanel";
export { SentenceAssistantWord } from "./components/SentenceAssistantWord";
export { SentenceAssistantExpression } from "./components/SentenceAssistantExpression";
export { SentenceAssistantShowTell } from "./components/SentenceAssistantShowTell";
export type { SentenceAssistantHostProps } from "./components/SentenceAssistantHost";
export type { SentenceAssistantPanelProps } from "./components/SentenceAssistantPanel";
export type { SentenceAssistantWordProps } from "./components/SentenceAssistantWord";
export type { SentenceAssistantExpressionProps } from "./components/SentenceAssistantExpression";
export type { SentenceAssistantShowTellProps } from "./components/SentenceAssistantShowTell";

/** Core Engine (권장 진입점) */
export {
  sentenceAssistantCore,
  SentenceAssistantCore,
} from "./core";

/** 하위 호환 서비스 파사드 */
export { DictionaryService } from "./lib/DictionaryService";
export { ExpressionService } from "./lib/ExpressionService";
export { ShowTellService } from "./lib/ShowTellService";

export {
  SENTENCE_ASSISTANT_TABS,
  type SentenceAssistantTabId,
  type SentenceSelection,
} from "./types";
