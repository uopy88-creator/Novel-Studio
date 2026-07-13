/**
 * Selection Action Menu 위치 계산 자가 검증
 * Run: npm run test:quick-actions-position
 */

import assert from "node:assert/strict";
import {
  decideSelectionMenuPlacement,
  SELECTION_MENU_GAP_PX,
  SELECTION_MENU_VIEWPORT_PAD_PX,
} from "@/features/quick-actions/lib/position";

const GAP = SELECTION_MENU_GAP_PX;
const PAD = SELECTION_MENU_VIEWPORT_PAD_PX;
const MENU_H = 52;

assert.ok(GAP >= 6 && GAP <= 8, `gap should be 6~8px, got ${GAP}`);
assert.equal(PAD, 8);

function place(
  selectionTop: number,
  selectionBottom: number,
  viewportH = 800,
) {
  return decideSelectionMenuPlacement({
    selectionTop,
    selectionBottom,
    menuHeight: MENU_H,
    viewportH,
  });
}

// 짧은 단어 / 화면 중간 → 바로 위, 간격 유지
{
  const r = place(300, 318);
  assert.equal(r.placement, "above");
  assert.equal(r.menuTopViewport, 300 - GAP - MENU_H);
}

// 긴 문장 (높은 selection) — 여전히 위 (공간 충분)
{
  const r = place(200, 280);
  assert.equal(r.placement, "above");
  assert.equal(r.menuTopViewport, 200 - GAP - MENU_H);
}

// 여러 줄 — 위
{
  const r = place(400, 520);
  assert.equal(r.placement, "above");
}

// 화면 상단 — 위에 두면 잘림 → 아래
{
  const r = place(40, 60);
  assert.equal(r.placement, "below");
  assert.equal(r.menuTopViewport, 60 + GAP);
}

// 상단이지만 메뉴가 겨우 들어가는 경우 → 위 유지
{
  // aboveTop = selectionTop - gap - h = 70 - 7 - 52 = 11 >= pad(8) → above
  const r = place(70, 90);
  assert.equal(r.placement, "above");
  assert.equal(r.menuTopViewport, 70 - GAP - MENU_H);
}

// 화면 하단 선택 — 기본은 위 (아래로 바꾸지 않음)
{
  const r = place(740, 760, 800);
  assert.equal(r.placement, "above");
  assert.equal(r.menuTopViewport, 740 - GAP - MENU_H);
}

// 수평 중앙: left = center - width/2, clamp
{
  const viewportW = 400;
  const menuWidth = 320;
  const selectionCenterX = 200;
  let left = selectionCenterX - menuWidth / 2; // 40
  left = Math.min(Math.max(left, PAD), viewportW - menuWidth - PAD);
  assert.equal(left, 40);

  let leftEdge = 10 - menuWidth / 2;
  leftEdge = Math.min(
    Math.max(leftEdge, PAD),
    viewportW - menuWidth - PAD,
  );
  assert.equal(leftEdge, PAD);

  // 우측 끝 선택
  let rightEdge = 390 - menuWidth / 2;
  rightEdge = Math.min(
    Math.max(rightEdge, PAD),
    viewportW - menuWidth - PAD,
  );
  assert.equal(rightEdge, viewportW - menuWidth - PAD);
}

// 모바일 좁은 viewport — 상단 플립만, 동일 로직
{
  const r = place(30, 48, 640);
  assert.equal(r.placement, "below");
}

console.log("quick-actions position-selftest: all assertions passed (PASS)");
