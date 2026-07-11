/**
 * =============================================================================
 * Context Help 레지스트리
 * -----------------------------------------------------------------------------
 * 새 토픽: topics/xxx.ts 작성 후 아래에 한 줄 등록.
 * =============================================================================
 */

import type {
  ContextHelpContent,
  ContextHelpTopicId,
} from "@/features/help/context/types";
import { dashboardHelp } from "@/features/help/context/topics/dashboard";
import { projectHelp } from "@/features/help/context/topics/project";
import { chaptersHelp } from "@/features/help/context/topics/chapters";
import { manuscriptHelp } from "@/features/help/context/topics/manuscript";
import { characterHelp } from "@/features/help/context/topics/character";
import { vaultHelp } from "@/features/help/context/topics/vault";
import { memoHelp } from "@/features/help/context/topics/memo";
import { foreshadowingHelp } from "@/features/help/context/topics/foreshadowing";
import { settingsHelp } from "@/features/help/context/topics/settings";
import { exportHelp } from "@/features/help/context/topics/export";

const REGISTRY: Record<ContextHelpTopicId, ContextHelpContent> = {
  dashboard: dashboardHelp,
  project: projectHelp,
  chapters: chaptersHelp,
  manuscript: manuscriptHelp,
  character: characterHelp,
  vault: vaultHelp,
  memo: memoHelp,
  foreshadowing: foreshadowingHelp,
  settings: settingsHelp,
  export: exportHelp,
};

export function getContextHelp(
  topic: ContextHelpTopicId,
): ContextHelpContent {
  return REGISTRY[topic];
}

export function listContextHelpTopics(): ContextHelpTopicId[] {
  return Object.keys(REGISTRY) as ContextHelpTopicId[];
}
