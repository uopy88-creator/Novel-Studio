/**
 * =============================================================================
 * Novel Studio — 데이터 관계도 (개념 모델)
 * -----------------------------------------------------------------------------
 *
 * Novel Studio는 "세계관 위키"가 아니라 "집필 작업실"이다.
 * 그래서 루트는 World가 아니라 Project(작품)이다.
 *
 * 한 작품 안에서 실제 글쓰기 흐름을 기준으로 데이터가 모인다.
 *
 * ```
 * Project                          ← 작업실의 루트 (작품 1개 = 작업실 1개)
 *  ├─ Settings                     ← 이 작품만의 집필 설정 (1:1)
 *  ├─ Chapters[]                   ← 원고의 뼈대 (순서 있는 장)
 *  │    └─ Manuscript (1:1)        ← 그 장의 실제 본문
 *  ├─ Characters[]                 ← 집필 중 바로 찾아보는 인물 카드
 *  ├─ Dialogues[]                  ← 대사 금고 (인물·챕터에 느슨하게 연결)
 *  ├─ Foreshadowings[]             ← 복선 추적 (심기/회수 챕터 연결)
 *  ├─ Memos[]                      ← 빠른 메모 (어디에든 붙여 둘 수 있음)
 *  └─ WritingSessions[]            ← 집필 통계의 원천 기록
 * ```
 *
 * 연결 원칙 (초보자용)
 * 1. 거의 모든 데이터는 projectId를 가진다.
 *    → "이 데이터가 어느 작품 것인가?"를 항상 알 수 있다.
 * 2. 강한 연결 vs 느슨한 연결을 구분한다.
 *    - 강함: Chapter ↔ Manuscript (장 없이 본문만 존재하면 안 됨)
 *    - 느슨: Dialogue.characterId (아직 누구 대사인지 몰라도 저장 가능)
 * 3. 세계관(World Bible)보다 Chapter/Manuscript가 중심이다.
 *    → 설정은 글을 쓰기 위한 보조 도구로 둔다.
 *
 * 주의
 * - 아래 ProjectTree는 "한 번에 전부 로드한다"는 뜻이 아니다.
 * - 관계 설명을 위한 개념 타입이다. 화면/CRUD는 아직 없다.
 * =============================================================================
 */

import type { Chapter } from "@/features/manuscript/types/chapter";
import type { Manuscript } from "@/features/manuscript/types/manuscript";
import type { Character } from "@/features/characters/types/character";
import type { Dialogue } from "@/features/dialogue-vault/types/dialogue";
import type { Foreshadowing } from "@/features/foreshadowing/types/foreshadowing";
import type { Memo } from "@/features/memo/types/memo";
import type { Project } from "@/features/projects/types/project";
import type { ProjectSettings } from "@/features/settings/types/project-settings";
import type {
  WritingSession,
  WritingStatsDaily,
} from "@/features/writing-statistics/types/writing-stats";

/**
 * 작품 하나를 중심으로 본 데이터 트리 (개념용).
 *
 * 실제 앱에서는 보통
 * - 목록 화면: Project만
 * - 에디터: Chapter + Manuscript
 * - 사이드 패널: Character / Memo 일부
 * 처럼 필요한 조각만 불러온다.
 */
export interface ProjectTree {
  project: Project;
  settings: ProjectSettings;
  chapters: Chapter[];
  /** chapterId 기준으로 Chapter와 1:1 매칭 */
  manuscripts: Manuscript[];
  characters: Character[];
  dialogues: Dialogue[];
  foreshadowings: Foreshadowing[];
  memos: Memo[];
  writingSessions: WritingSession[];
  /** 세션을 날짜별로 집계한 캐시/뷰 (선택적으로 보관) */
  writingStatsDaily: WritingStatsDaily[];
}

/**
 * 엔티티가 "어느 작품에 속하는지" 보장하기 위한 최소 계약.
 * 새 도메인 데이터를 추가할 때 이 형태를 따르면 실수가 줄어든다.
 */
export interface BelongsToProject {
  projectId: import("@/types/ids").ProjectId;
}
