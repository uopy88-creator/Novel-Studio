/**
 * expression-lemma — 하위 호환 재수출 (Lemma Engine)
 */

export {
  generateLemmaCandidates,
  LemmaEngine,
  lemmaEngine,
} from "@/features/sentence-assistant/engines/lemma/LemmaEngine";

import { lemmaEngine } from "@/features/sentence-assistant/engines/lemma/LemmaEngine";

/** @deprecated use lemmaEngine.resolve / analyze */
export function resolveExpressionLemma(
  rawWord: string,
  headwords: ReadonlySet<string> | ReadonlyMap<string, unknown>,
): string {
  return lemmaEngine.resolve(rawWord, headwords);
}

/** @deprecated use lemmaEngine.clearCache */
export function clearExpressionLemmaCache(): void {
  lemmaEngine.clearCache();
}
