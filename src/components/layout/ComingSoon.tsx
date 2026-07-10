/**
 * =============================================================================
 * ComingSoon
 * -----------------------------------------------------------------------------
 * 아직 기능이 없는 메뉴용 공통 화면.
 * "준비 중"만 보여 주고, 실제 Dashboard/Manuscript 등은 구현하지 않는다.
 * =============================================================================
 */

import { ContentContainer } from "@/components/layout/ContentContainer";

export interface ComingSoonProps {
  /** 메뉴/기능 이름 (예: Manuscript) */
  featureName: string;
}

export function ComingSoon({ featureName }: ComingSoonProps) {
  return (
    <ContentContainer>
      <p className="ns-caption mb-ns-2">Novel Studio</p>
      <h2 className="ns-heading">{featureName}</h2>
      <p className="mt-ns-4 text-ns-lg text-ns-ink-secondary">준비 중</p>
      <p className="mt-ns-2 max-w-md text-ns-sm leading-ns-relaxed text-ns-ink-tertiary">
        이 기능은 아직 만들지 않았습니다. 레이아웃과 메뉴만 연결되어 있습니다.
      </p>
    </ContentContainer>
  );
}
