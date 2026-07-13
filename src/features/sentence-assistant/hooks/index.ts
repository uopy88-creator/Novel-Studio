/**
 * =============================================================================
 * hooks — Core Engine 을 UI 에 연결하는 얇은 래퍼
 * -----------------------------------------------------------------------------
 * 마크업·스타일은 바꾸지 않고, 조회만 Core 로 위임한다.
 * =============================================================================
 */

export { useDictionaryLookup } from "@/features/sentence-assistant/hooks/useDictionaryLookup";
export { useSynonymLookup } from "@/features/sentence-assistant/hooks/useSynonymLookup";
export { useShowTellAnalysis } from "@/features/sentence-assistant/hooks/useShowTellAnalysis";
