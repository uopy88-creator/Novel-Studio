/**
 * =============================================================================
 * ComingSoon (+ optional Context Help)
 * =============================================================================
 */

"use client";

import { ContentContainer } from "@/components/layout/ContentContainer";
import { ContextHelp } from "@/features/help";
import type { ContextHelpTopicId } from "@/features/help";

export interface ComingSoonProps {
  /** 메뉴/기능 이름 (예: Manuscript) */
  featureName: string;
  /** Context Help 토픽 */
  helpTopic?: ContextHelpTopicId;
  projectId?: string;
}

export function ComingSoon({
  featureName,
  helpTopic,
  projectId,
}: ComingSoonProps) {
  return (
    <ContentContainer>
      <header className="mb-ns-4 flex items-start justify-between gap-ns-3">
        <div>
          <p className="ns-caption mb-ns-2">Novel Studio</p>
          <h2 className="ns-heading">{featureName}</h2>
        </div>
        {helpTopic ? (
          <ContextHelp topic={helpTopic} projectId={projectId} />
        ) : null}
      </header>
      <p className="mt-ns-4 text-ns-lg text-ns-ink-secondary">준비 중</p>
      <p className="mt-ns-2 max-w-md text-ns-sm leading-ns-relaxed text-ns-ink-tertiary">
        이 기능은 아직 만들지 않았습니다. 레이아웃과 메뉴만 연결되어 있습니다.
        {helpTopic
          ? " 오른쪽 위 Help에서 예정된 사용법을 미리 볼 수 있습니다."
          : null}
      </p>
    </ContentContainer>
  );
}
