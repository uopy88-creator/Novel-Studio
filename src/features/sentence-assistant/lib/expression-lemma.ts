/**
 * expression-lemma — 하위 호환 재수출 (Lemma Engine)
 */

export {
  generateLemmaCandidates,
  LemmaEngine,
  lemmaEngine,
} from "@/features/sentence-assistant/engines/lemma/LemmaEngine";

import { lemmaEngine } from "@/features/sentence-assistant/engines/lemma/LemmaEngine";

/** @deprecated use sentenceAssistantCore.analyzeWord / resolveLemma */
export function resolveExpressionLemma(
  rawWord: string,
  headwords: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): string {
  return lemmaEngine.resolve(rawWord, headwords);
}

/** @deprecated use sentenceAssistantCore.clearAllCaches / sentenceEngine.clearCache */
export function clearExpressionLemmaCache(): void {
  lemmaEngine.clearCache();
}
