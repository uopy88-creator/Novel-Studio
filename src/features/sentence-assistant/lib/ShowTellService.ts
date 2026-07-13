/**
 * =============================================================================
 * ShowTellService — 하위 호환 파사드
 * -----------------------------------------------------------------------------
 * 구현은 Core → ShowTell Engine. 기존 import 경로 유지.
 * =============================================================================
 */

import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import { showTellEngine } from "@/features/sentence-assistant/engines/show-tell/ShowTellEngine";
import type {
  ShowTellAnalysis,
  ShowTellExampleResult,
  ShowTellKind,
  ShowTellStyleId,
} from "@/features/sentence-assistant/engines/show-tell/show-tell-types";

export function analyzeSentence(raw: string): ShowTellAnalysis | null {
  return sentenceAssistantCore.analyzeShowTell(raw);
}

/** Tell → Show 작법 방향 독립 예시 (여러 개) */
export function getCraftExamples(
  sentence: string,
  style: ShowTellStyleId,
): ShowTellExampleResult {
  return (
    sentenceAssistantCore.getShowTellCraftExamples(sentence, style) ?? {
      style,
      examples: [],
    }
  );
}

/**
 * @deprecated getCraftExamples 사용. targetKind 무시.
 */
export function getReferenceExample(
  sentence: string,
  targetKind: ShowTellKind,
  style: ShowTellStyleId,
): ShowTellExampleResult {
  void targetKind;
  return getCraftExamples(sentence, style);
}

export const ShowTellService = {
  analyze: analyzeSentence,
  analyzeSentence,
  getCraftExamples,
  getReferenceExample,
  detectTheme: (sentence: string) => showTellEngine.detectTheme(sentence),
};
