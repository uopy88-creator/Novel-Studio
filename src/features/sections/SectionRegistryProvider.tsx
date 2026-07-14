"use client";

/**
 * =============================================================================
 * SectionRegistryProvider
 * -----------------------------------------------------------------------------
 * 프로젝트 레이아웃에서 Manuscript Section 을 한 번 hydrate 하고,
 * focus 시 디스크와 재동기화한다.
 * =============================================================================
 */

import { useEffect, type ReactNode } from "react";
import type { ProjectId } from "@/types/ids";
import { hydrateSectionRegistry } from "@/features/sections/hydrate-section-registry";
import { resetSectionRegistry } from "@/features/sections/section-registry";

export interface SectionRegistryProviderProps {
  projectId: ProjectId;
  children: ReactNode;
}

export function SectionRegistryProvider({
  projectId,
  children,
}: SectionRegistryProviderProps) {
  // 프로젝트 진입 시 1회 hydrate
  useEffect(() => {
    void hydrateSectionRegistry(projectId).catch((error) => {
      console.error("[SectionRegistry] hydrate failed", error);
    });
    return () => {
      // 프로젝트 이탈 시 스토어 정리 (다른 작품과 섞이지 않게)
      resetSectionRegistry(projectId);
    };
  }, [projectId]);

  // 다른 탭/창에서 Manuscript 저장 후 돌아올 때 재동기화
  useEffect(() => {
    let inflight: Promise<void> | null = null;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (inflight) return;
      inflight = hydrateSectionRegistry(projectId, { force: true })
        .catch((error) => {
          console.error("[SectionRegistry] focus hydrate failed", error);
        })
        .finally(() => {
          inflight = null;
        });
    };
    // focus + visibilitychange 동시 발생 시 한 번만 hydrate
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [projectId]);

  return children;
}
