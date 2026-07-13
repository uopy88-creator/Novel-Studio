/**
 * =============================================================================
 * ExpressionService — 하위 호환 파사드
 * -----------------------------------------------------------------------------
 * 구현은 Core → Synonym Engine (+ Lemma). 기존 import 경로 유지.
 * =============================================================================
 */

import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import type { ExpressionLookupResult } from "@/features/sentence-assistant/engines/synonym/synonym-types";

export function lookupExpressions(rawQuery: string): ExpressionLookupResult {
  return sentenceAssistantCore.lookupExpressions(rawQuery);
}

export const ExpressionService = {
  lookupExpressions,
};
