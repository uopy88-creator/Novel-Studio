/**
 * =============================================================================
 * Selection Action Menu 위치 계산
 * -----------------------------------------------------------------------------
 * - 기본: 선택 영역 **위** (간격 20~24px), 선택 중앙 정렬
 * - 상단 공간 부족 시: 선택 영역 **아래**
 * - Viewport 밖으로 잘리지 않게 clamp
 * - 브라우저 우클릭 메뉴와 겹침 최소화 (위쪽 우선 — 컨텍스트 메뉴는 보통 커서 아래·오른쪽)
 *
 * textarea 는 Range.getBoundingClientRect 가 동작하지 않으므로
 * 스타일 미러 div 로 Selection BoundingClientRect 를 구한다.
 *
 * 반환 좌표는 `position:absolute` 부모(textarea 래퍼) 기준.
 * =============================================================================
 */

export interface QuickActionsPosition {
  top: number;
  left: number;
  /** 테스트용 — viewport 기준 선택 rect */
  selectionRect?: DOMRect;
  placement?: "above" | "below";
}

/** 선택 텍스트와 메뉴 사이 간격 (px) */
export const SELECTION_MENU_GAP_PX = 22;

/** 메뉴가 viewport 가장자리에서 유지할 여백 */
const VIEWPORT_PAD = 8;

/**
 * textarea 선택 구간의 viewport BoundingClientRect.
 * 미러 div 를 textarea 와 같은 화면 위치에 올려 span 을 측정한다.
 */
export function getTextareaSelectionBoundingClientRect(
  el: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number,
): DOMRect {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  const elRect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  const mirror = document.createElement("div");
  mirror.setAttribute("data-ns-qa-mirror", "1");
  mirror.style.cssText = [
    "position:fixed",
    `top:${elRect.top}px`,
    `left:${elRect.left}px`,
    `width:${el.clientWidth}px`,
    `height:${el.clientHeight}px`,
    "visibility:hidden",
    "pointer-events:none",
    "overflow:hidden",
    "white-space:pre-wrap",
    "word-wrap:break-word",
    "overflow-wrap:break-word",
    `box-sizing:${style.boxSizing}`,
    `padding:${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
    `border:${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`,
    `border-style:${style.borderTopStyle}`,
    `font:${style.font}`,
    `line-height:${style.lineHeight}`,
    `letter-spacing:${style.letterSpacing}`,
    `text-align:${style.textAlign}`,
    `text-indent:${style.textIndent}`,
    `text-transform:${style.textTransform}`,
    `direction:${style.direction}`,
  ].join(";");

  const value = el.value;
  const before = value.slice(0, start);
  const selected = value.slice(start, end) || "\u200b";
  const after = value.slice(end);

  const mark = document.createElement("span");
  mark.textContent = selected;

  mirror.appendChild(document.createTextNode(before));
  mirror.appendChild(mark);
  mirror.appendChild(document.createTextNode(after.length > 0 ? after : "."));
  document.body.appendChild(mirror);

  mirror.scrollTop = el.scrollTop;
  mirror.scrollLeft = el.scrollLeft;

  const markRect = mark.getBoundingClientRect();
  document.body.removeChild(mirror);

  return new DOMRect(
    markRect.left,
    markRect.top,
    Math.max(markRect.width, 1),
    Math.max(markRect.height, 1),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Selection BoundingClientRect 기준으로 메뉴 위치를 계산한다.
 * absolute 부모(textarea 래퍼) 기준 top/left 를 반환한다.
 */
export function estimateQuickActionsPosition(
  el: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number = selectionStart,
  menuWidth = 320,
  menuHeight = 52,
): QuickActionsPosition {
  const parent = el.offsetParent as HTMLElement | null;
  const parentRect =
    parent?.getBoundingClientRect() ?? el.getBoundingClientRect();

  const selectionRect = getTextareaSelectionBoundingClientRect(
    el,
    selectionStart,
    selectionEnd,
  );

  const gap = SELECTION_MENU_GAP_PX;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const selectionCenterX = selectionRect.left + selectionRect.width / 2;

  // 기본: 선택 위쪽 (컨텍스트 메뉴는 보통 커서 아래·오른쪽에 열려 겹침 감소)
  let placement: "above" | "below" = "above";
  let menuTopViewport = selectionRect.top - gap - menuHeight;

  const spaceAbove = selectionRect.top - VIEWPORT_PAD;
  const spaceBelow = viewportH - selectionRect.bottom - VIEWPORT_PAD;

  if (menuTopViewport < VIEWPORT_PAD) {
    if (spaceBelow >= menuHeight + gap || spaceBelow >= spaceAbove) {
      placement = "below";
      menuTopViewport = selectionRect.bottom + gap;
    } else {
      placement = "above";
      menuTopViewport = VIEWPORT_PAD;
    }
  }

  menuTopViewport = clamp(
    menuTopViewport,
    VIEWPORT_PAD,
    Math.max(VIEWPORT_PAD, viewportH - menuHeight - VIEWPORT_PAD),
  );

  // 수평: 선택 중앙. 우클릭 메뉴(주로 오른쪽)와 겹침을 줄이려 약간 왼쪽.
  let menuLeftViewport = selectionCenterX - menuWidth / 2 - 12;
  menuLeftViewport = clamp(
    menuLeftViewport,
    VIEWPORT_PAD,
    Math.max(VIEWPORT_PAD, viewportW - menuWidth - VIEWPORT_PAD),
  );

  return {
    top: menuTopViewport - parentRect.top,
    left: menuLeftViewport - parentRect.left,
    selectionRect,
    placement,
  };
}

/** @deprecated 시그니처 호환 — selectionEnd 생략 시 start 사용 */
export function estimateQuickActionsPositionLegacy(
  el: HTMLTextAreaElement,
  selectionStart: number,
  menuWidth = 320,
  menuHeight = 52,
): QuickActionsPosition {
  return estimateQuickActionsPosition(
    el,
    selectionStart,
    selectionStart,
    menuWidth,
    menuHeight,
  );
}
