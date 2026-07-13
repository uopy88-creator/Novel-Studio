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

export function getReferenceExample(
  sentence: string,
  targetKind: ShowTellKind,
  style: ShowTellStyleId,
): ShowTellExampleResult {
  return (
    sentenceAssistantCore.getShowTellExample(sentence, targetKind, style) ?? {
      style,
      example: "",
    }
  );
}

export const ShowTellService = {
  analyze: analyzeSentence,
  analyzeSentence,
  getReferenceExample,
  detectTheme: (sentence: string) => showTellEngine.detectTheme(sentence),
};
