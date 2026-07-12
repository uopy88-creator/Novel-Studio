/**
 * =============================================================================
 * Foreshadowing (복선)
 * -----------------------------------------------------------------------------
 * 작가가 「심어 둔 것」과 「회수할 것」을 직접 기록·관리하는 도구입니다.
 * AI가 생성하거나 분석하지 않습니다.
 *
 * 상태 (Status)
 *   planted        → 심음
 *   pending_payoff → 회수 예정
 *   paid_off       → 회수 완료
 *
 * 향후 확장 (UI에는 아직 노출하지 않음)
 * - plantedChapterId / payoffChapterId → Section·원고 연결
 * - relatedCharacterIds → Character 연결
 * =============================================================================
 */

import type {
  ChapterId,
  CharacterId,
  ForeshadowingId,
  ProjectId,
  Timestamps,
} from "@/types/ids";

/**
 * 복선 생명주기.
 * 기본값은 planted(심음).
 */
export type ForeshadowingStatus =
  | "planted" // 심음
  | "pending_payoff" // 회수 예정
  | "paid_off"; // 회수 완료

/** 상태 표시 순서 (필터·폼에서 공통 사용) */
export const FORESHADOWING_STATUSES: readonly ForeshadowingStatus[] = [
  "planted",
  "pending_payoff",
  "paid_off",
] as const;

/** 한국어 라벨 */
export const FORESHADOWING_STATUS_LABELS: Record<ForeshadowingStatus, string> =
  {
    planted: "심음",
    pending_payoff: "회수 예정",
    paid_off: "회수 완료",
  };

/** 생성 시 기본 상태 */
export const DEFAULT_FORESHADOWING_STATUS: ForeshadowingStatus = "planted";

/**
 * 복선 엔티티.
 *
 * 핵심 필드: id, projectId, title, description, status, createdAt, updatedAt
 * 확장 필드(향후 Section / Character 연결용): plantedChapterId 등
 */
export interface Foreshadowing extends Timestamps {
  id: ForeshadowingId;

  projectId: ProjectId;

  /** 복선 제목 (목록용 짧은 이름) — 필수 */
  title: string;

  /** 무엇을 심었는지 / 어떻게 회수할지 설명 — 선택 */
  description?: string;

  status: ForeshadowingStatus;

  /**
   * 복선을 심은(또는 심을) 챕터.
   * 향후 Section·원고 연결용 — 현재 UI에서는 편집하지 않음.
   */
  plantedChapterId?: ChapterId;

  /**
   * 복선을 회수한(또는 회수할) 챕터.
   * 향후 Section·원고 연결용 — 현재 UI에서는 편집하지 않음.
   */
  payoffChapterId?: ChapterId;

  /**
   * 관련된 인물들.
   * 향후 Character 연결용 — 현재 UI에서는 편집하지 않음.
   */
  relatedCharacterIds: CharacterId[];

  /**
   * 중요도 1~5 (정렬·강조용, 선택).
   * 현재 UI에서는 노출하지 않으며 기본값 3을 유지한다.
   */
  importance: 1 | 2 | 3 | 4 | 5;
}

/**
 * DB·로컬에 남아 있을 수 있는 구 상태 값을 새 상태로 정규화한다.
 * - planned  → planted (예전 「아직 안 심음」을 심음으로)
 * - dropped  → planted (폐기 항목도 목록에 남기되 심음으로)
 * - 알 수 없는 값 → planted
 */
export function normalizeForeshadowingStatus(
  raw: string | null | undefined,
): ForeshadowingStatus {
  if (raw === "planted" || raw === "pending_payoff" || raw === "paid_off") {
    return raw;
  }
  if (raw === "planned" || raw === "dropped") {
    return "planted";
  }
  return DEFAULT_FORESHADOWING_STATUS;
}
