/**
 * Selection Action Menu 위치 계산 자가 검증
 * Run: npx --yes tsx src/features/quick-actions/__tests__/position-selftest.ts
 *
 * jsdom 없이 순수 clamp/placement 규칙을 검증할 수 있도록
 * estimate 의 핵심 분기를 동일 로직으로 재현한다.
 */

import assert from "node:assert/strict";
import { SELECTION_MENU_GAP_PX } from "@/features/quick-actions/lib/position";

const GAP = SELECTION_MENU_GAP_PX;
const VIEWPORT_PAD = 8;

function decidePlacement(params: {
  selectionTop: number;
  selectionBottom: number;
  menuHeight: number;
  viewportH: number;
}): "above" | "below" {
  const { selectionTop, selectionBottom, menuHeight, viewportH } = params;
  const menuTop = selectionTop - GAP - menuHeight;
  const spaceAbove = selectionTop - VIEWPORT_PAD;
  const spaceBelow = viewportH - selectionBottom - VIEWPORT_PAD;

  if (menuTop < VIEWPORT_PAD) {
    if (spaceBelow >= menuHeight + GAP || spaceBelow >= spaceAbove) {
      return "below";
    }
    return "above";
  }
  return "above";
}

assert.equal(GAP, 22);

// 화면 중간 → 위
assert.equal(
  decidePlacement({
    selectionTop: 300,
    selectionBottom: 320,
    menuHeight: 52,
    viewportH: 800,
  }),
  "above",
);

// 화면 상단 → 아래
assert.equal(
  decidePlacement({
    selectionTop: 40,
    selectionBottom: 60,
    menuHeight: 52,
    viewportH: 800,
  }),
  "below",
);

// 수평 중앙: left = center - width/2 - 12, clamp to viewport
{
  const viewportW = 400;
  const menuWidth = 320;
  const selectionCenterX = 200;
  let left = selectionCenterX - menuWidth / 2 - 12; // 28
  left = Math.min(
    Math.max(left, VIEWPORT_PAD),
    viewportW - menuWidth - VIEWPORT_PAD,
  );
  assert.equal(left, 28);

  // 좌측 끝 선택 → clamp to pad
  let leftEdge = 10 - menuWidth / 2 - 12;
  leftEdge = Math.min(
    Math.max(leftEdge, VIEWPORT_PAD),
    viewportW - menuWidth - VIEWPORT_PAD,
  );
  assert.equal(leftEdge, VIEWPORT_PAD);
}

console.log("quick-actions position-selftest: all assertions passed (PASS)");
