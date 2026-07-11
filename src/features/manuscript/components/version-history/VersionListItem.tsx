"use client";

/**
 * =============================================================================
 * VersionListItem — 버전 한 줄 (이름 수정 · 비교 · 복원)
 * =============================================================================
 */

import { useEffect, useState } from "react";
import type { ManuscriptVersion } from "@/features/manuscript/types/manuscript-version";
import { displayVersionName } from "@/features/manuscript/types/manuscript-version";
import { formatShortDate, formatShortTime } from "@/lib/format-date";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export interface VersionListItemProps {
  version: ManuscriptVersion;
  onRename: (versionId: string, name: string) => void;
  onCompare: (version: ManuscriptVersion) => void;
  onRestore: (version: ManuscriptVersion) => void;
  className?: string;
}

export function VersionListItem({
  version,
  onRename,
  onCompare,
  onRestore,
  className,
}: VersionListItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(version.name);

  useEffect(() => {
    if (!editing) setDraft(version.name);
  }, [version.name, editing]);

  function commitRename() {
    const next = draft.trim();
    setEditing(false);
    if (next !== version.name.trim()) {
      onRename(version.id, next);
    }
  }

  return (
    <li
      className={cn(
        "rounded-ns-lg border border-ns-border bg-ns-surface px-ns-3 py-ns-3",
        className,
      )}
    >
      <div className="flex flex-col gap-ns-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") {
                  setDraft(version.name);
                  setEditing(false);
                }
              }}
              placeholder={`Version ${version.versionNumber}`}
              aria-label="버전 이름"
              autoFocus
              className="text-ns-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="block w-full truncate text-left text-ns-sm font-medium text-ns-ink hover:text-ns-accent"
              title="클릭하여 이름 변경"
            >
              {displayVersionName(version)}
            </button>
          )}
          <p className="mt-1 text-ns-xs text-ns-ink-tertiary">
            {formatShortDate(version.createdAt)}{" "}
            {formatShortTime(version.createdAt)}
            {" · "}
            {version.wordCount.toLocaleString()}자
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-ns-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onCompare(version)}
          >
            비교
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onRestore(version)}
          >
            복원
          </Button>
        </div>
      </div>
    </li>
  );
}
