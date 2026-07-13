/**
 * =============================================================================
 * textarea 선택 근처 Quick Actions 배치
 * -----------------------------------------------------------------------------
 * absolute (textarea 부모 relative 기준). viewport fixed / sticky 아님.
 * 스크롤 시 호출측에서 다시 계산한다.
 * =============================================================================
 */

export interface QuickActionsPosition {
  top: number;
  left: number;
}

/**
 * 선택 시작 오프셋 근처 좌표를 추정하고,
 * 컨테이너(textarea) 안으로 clamp 한다.
 */
export function estimateQuickActionsPosition(
  el: HTMLTextAreaElement,
  selectionStart: number,
  menuWidth = 280,
  menuHeight = 48,
): QuickActionsPosition {
  const style = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight) || 28;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;

  const before = el.value.slice(0, selectionStart);
  const lines = before.split("\n");
  const lineIndex = lines.length - 1;
  const col = lines[lines.length - 1]?.length ?? 0;

  // 선택 텍스트 아래쪽에 두어 본문을 덜 가린다
  let top =
    paddingTop + lineIndex * lineHeight - el.scrollTop + lineHeight + 6;
  let left =
    paddingLeft + Math.min(col, 40) * 8 - el.scrollLeft;

  const maxLeft = Math.max(
    8,
    el.clientWidth - menuWidth - paddingRight - 8,
  );
  const maxTop = Math.max(8, el.clientHeight - menuHeight - 8);

  top = Math.min(Math.max(8, top), maxTop);
  left = Math.min(Math.max(8, left), maxLeft);

  return { top, left };
}
