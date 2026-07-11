/**
 * =============================================================================
 * Word Treasury (어휘 금고 / Word Vault)
 * -----------------------------------------------------------------------------
 * 단어 · 관용구 · 말투 샘플을 모아 두는 보관함.
 * Dialogue Vault 가 "대사"라면, 여기는 "어휘"입니다.
 * UI 화면은 아직 Coming soon — 저장 계층만 클라우드로 준비합니다.
 * =============================================================================
 */

import type { ProjectId, Timestamps, WordTreasuryId } from "@/types/ids";

export interface WordTreasuryEntry extends Timestamps {
  id: WordTreasuryId;
  projectId: ProjectId;
  /** 단어 / 표현 */
  word: string;
  /** 뜻 · 설명 */
  meaning: string;
  /** 예문 */
  example: string;
  /** 자유 메모 */
  note: string;
  tags: string[];
  isFavorite: boolean;
}

export type WordTreasuryInput = {
  word: string;
  meaning?: string;
  example?: string;
  note?: string;
  tags?: string[];
  isFavorite?: boolean;
};
