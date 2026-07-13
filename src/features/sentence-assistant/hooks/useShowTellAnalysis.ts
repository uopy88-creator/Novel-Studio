"use client";

/**
 * Show / Tell 분석 훅 — Core → ShowTell Engine
 */

import { useMemo } from "react";
import { sentenceAssistantCore } from "@/features/sentence-assistant/core";
import type { ShowTellAnalysis } from "@/features/sentence-assistant/engines/show-tell/show-tell-types";

export function useShowTellAnalysis(
  selectedText: string,
): ShowTellAnalysis | null {
  return useMemo(
    () => sentenceAssistantCore.analyzeShowTell(selectedText),
    [selectedText],
  );
}
