/**
 * =============================================================================
 * Studio 사이드바 메뉴 정의
 * -----------------------------------------------------------------------------
 * 각 항목은 /projects/[projectId]/[segment] 로 이동한다.
 * =============================================================================
 */

export interface StudioNavItem {
  /** URL 세그먼트 (projects/:id/ 다음) */
  segment: string;
  /** 사이드바에 보이는 이름 */
  label: string;
  /** 메뉴 아이콘 (이모지 — 의존성 없이 가볍게) */
  icon: string;
}

/**
 * 사이드바 메뉴 순서.
 * Dashboard 기능을 구현하는 것이 아니라, 진입 경로만 마련한다.
 */
export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  { segment: "dashboard", label: "Dashboard", icon: "🏠" },
  { segment: "manuscript", label: "Manuscript", icon: "✍" },
  { segment: "sections", label: "Section", icon: "📑" },
  { segment: "timeline", label: "Timeline", icon: "⏱" },
  { segment: "characters", label: "Characters", icon: "👤" },
  { segment: "writing-vault", label: "Writing Vault", icon: "💬" },
  { segment: "inspiration", label: "Inspiration", icon: "💡" },
  { segment: "foreshadowing", label: "Foreshadowing", icon: "🎯" },
  { segment: "memo", label: "Memo", icon: "📝" },
  { segment: "settings", label: "Settings", icon: "⚙" },
  { segment: "trash", label: "Trash", icon: "🗑" },
];

/** 작품 작업실 경로 생성 */
export function studioPath(projectId: string, segment: string): string {
  return `/projects/${projectId}/${segment}`;
}
