/**
 * Novel Studio 공통 도메인 타입 진입점.
 *
 * 기능별 상세 타입은 features/[feature]/types 에 두고,
 * 여기서는 여러 기능이 공유하는 식별자·관계 개념만 모은다.
 */
export type {
  BelongsToProject,
  ProjectTree,
} from "./project-tree";

export type {
  ChapterId,
  CharacterId,
  DialogueId,
  DocumentId,
  EntityId,
  ForeshadowingId,
  ISODate,
  ISODateTime,
  ManuscriptId,
  MemoId,
  ProjectId,
  Timestamps,
  WritingSessionId,
} from "./ids";
