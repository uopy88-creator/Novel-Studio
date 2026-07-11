/**
 * =============================================================================
 * 검색어 하이라이트
 * =============================================================================
 */

import { createElement, type ReactNode } from "react";

/**
 * text 안에서 query 와 일치하는 구간을 <mark> 로 감싼다.
 * 대소문자 무시. 빈 쿼리면 원문 그대로.
 */
export function highlightQuery(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q || !text) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQuery, cursor);
    if (idx < 0) {
      parts.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) {
      parts.push(text.slice(cursor, idx));
    }
    parts.push(
      createElement(
        "mark",
        {
          key: `h-${key}`,
          className:
            "rounded-sm bg-ns-accent-soft px-0.5 text-ns-ink [box-decoration-break:clone]",
        },
        text.slice(idx, idx + q.length),
      ),
    );
    key += 1;
    cursor = idx + q.length;
  }

  return parts.length === 1 ? parts[0] : parts;
}
