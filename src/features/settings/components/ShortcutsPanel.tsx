"use client";

/**
 * =============================================================================
 * ShortcutsPanel — 단축키 목록
 * =============================================================================
 */

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl / ⌘ + K", action: "프로젝트 전체 검색" },
  { keys: "Esc", action: "모달 · 검색 닫기" },
  { keys: "↑ / ↓", action: "검색 결과 이동" },
  { keys: "Enter", action: "검색 결과 열기" },
  { keys: "@", action: "원고에서 캐릭터 멘션" },
];

export function ShortcutsPanel() {
  return (
    <ul className="divide-y divide-ns-border rounded-ns-md border border-ns-border">
      {SHORTCUTS.map((row) => (
        <li
          key={row.keys}
          className="flex items-center justify-between gap-ns-3 px-ns-3 py-ns-2.5"
        >
          <span className="text-ns-sm text-ns-ink">{row.action}</span>
          <kbd className="shrink-0 rounded-ns-sm border border-ns-border bg-ns-muted px-ns-2 py-0.5 text-ns-xs text-ns-ink-secondary">
            {row.keys}
          </kbd>
        </li>
      ))}
    </ul>
  );
}
