"use client";

/**
 * =============================================================================
 * ContextHelp — 버튼 + 패널 묶음
 * -----------------------------------------------------------------------------
 * 페이지 헤더에 한 줄로 붙인다.
 * <ContextHelp topic="character" projectId={projectId} />
 * =============================================================================
 */

import { useState } from "react";
import type { ProjectId } from "@/types/ids";
import type { ContextHelpTopicId } from "@/features/help/context/types";
import { ContextHelpButton } from "@/features/help/components/ContextHelpButton";
import { ContextHelpPanel } from "@/features/help/components/ContextHelpPanel";

export interface ContextHelpProps {
  topic: ContextHelpTopicId;
  projectId?: ProjectId | string | null;
  className?: string;
  /** 버튼 접근성/툴팁 (기본: 이 화면 도움말) */
  label?: string;
}

export function ContextHelp({
  topic,
  projectId,
  className,
  label,
}: ContextHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ContextHelpButton
        className={className}
        label={label}
        onClick={() => setOpen(true)}
      />
      <ContextHelpPanel
        open={open}
        onClose={() => setOpen(false)}
        topic={topic}
        projectId={projectId}
      />
    </>
  );
}
