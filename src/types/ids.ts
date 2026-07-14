/**
 * =============================================================================
 * Novel Studio — 공통 식별자 / 시간 타입
 * -----------------------------------------------------------------------------
 * 왜 따로 두나?
 * - 나중에 DB(UUID, CUID 등)를 바꿔도 도메인 코드는 Id 별칭만 보면 된다.
 * - 날짜는 전부 ISO 8601 문자열로 통일한다. (서버/클라이언트 직렬화가 쉽고,
 *   Date 객체를 여기저기 흘리면 타임존 버그가 난다.)
 * =============================================================================
 */

/** 엔티티 고유 ID. 생성 방식(UUID 등)은 인프라 단계에서 결정한다. */
export type EntityId = string;

/** 작품(Project) ID */
export type ProjectId = EntityId;

/** 챕터 / Document ID (저장 JSON 필드명은 chapterId 유지) */
export type ChapterId = EntityId;

/** 제품 언어 별칭 — Document ≈ Chapter */
export type DocumentId = ChapterId;

/** 원고(Manuscript) 문서 ID */
export type ManuscriptId = EntityId;

/** 캐릭터 ID */
export type CharacterId = EntityId;

/** 대사(Dialogue) ID */
/** Writing Vault 항목 ID */
export type WritingVaultEntryId = EntityId;

/** @deprecated WritingVaultEntryId 사용 */
export type DialogueId = WritingVaultEntryId;

/** 복선(Foreshadowing) ID */
export type ForeshadowingId = EntityId;

/** 메모 ID */
export type MemoId = EntityId;

/** 영감 노트 ID */
export type InspirationId = EntityId;

/** 어휘 금고(Word Treasury) 항목 ID */
export type WordTreasuryId = EntityId;

/** Timeline 사건 ID */
export type TimelineEventId = EntityId;

/** 집필 세션 ID */
export type WritingSessionId = EntityId;

/**
 * ISO 8601 날짜시간 문자열
 * @example "2026-07-10T04:30:00.000Z"
 */
export type ISODateTime = string;

/**
 * 캘린더 날짜 (통계·목표용). 시간은 포함하지 않는다.
 * @example "2026-07-10"
 */
export type ISODate = string;

/**
 * 거의 모든 엔티티가 공유하는 생성/수정 시각.
 * CRUD를 아직 만들지 않아도, 나중에 정렬·동기화에 필요하므로 미리 넣는다.
 */
export interface Timestamps {
  /** 처음 생성된 시각 */
  createdAt: ISODateTime;
  /** 마지막으로 수정된 시각 */
  updatedAt: ISODateTime;
}
