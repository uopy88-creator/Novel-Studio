/**
 * =============================================================================
 * Selection Action Menu 위치 계산
 * -----------------------------------------------------------------------------
 * - 기본: 선택 영역 **바로 위** (간격 6~8px), 선택 중앙 정렬
 * - 화면 상단으로 메뉴가 잘릴 때만 선택 영역 **아래**
 * - Viewport 좌우·하단에 완전히 벗어나지 않게 clamp
 *
 * textarea 는 Range.getBoundingClientRect 가 동작하지 않으므로
 * 스타일 미러 div 로 Selection BoundingClientRect 를 구한다.
 * (contenteditable 등 Range 가 있으면 동일 rect 기준 로직을 재사용)
 *
 * 반환 좌표는 `position:absolute` 부모(textarea 래퍼) 기준.
 * PC / 모바일 공통.
 * =============================================================================
 */

export interface QuickActionsPosition {
  top: number;
  left: number;
  /** viewport 기준 좌표 — position:fixed 메뉴용 */
  viewportTop: number;
  viewportLeft: number;
  /** 테스트용 — viewport 기준 선택 rect */
  selectionRect?: DOMRect;
  placement?: "above" | "below";
}

/** 선택 텍스트와 메뉴 사이 간격 (px) — 약 6~8px */
export const SELECTION_MENU_GAP_PX = 7;

/** 메뉴가 viewport 가장자리에서 유지할 여백 */
export const SELECTION_MENU_VIEWPORT_PAD_PX = 8;

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
 * 선택 rect 기준 placement 결정 (순수 함수 — 테스트·PC/모바일 공용).
 * 기본은 위. 상단에 메뉴가 잘릴 때만 아래.
 */
export function decideSelectionMenuPlacement(params: {
  selectionTop: number;
  selectionBottom: number;
  menuHeight: number;
  viewportH: number;
  gap?: number;
  viewportPad?: number;
}): { placement: "above" | "below"; menuTopViewport: number } {
  const gap = params.gap ?? SELECTION_MENU_GAP_PX;
  const pad = params.viewportPad ?? SELECTION_MENU_VIEWPORT_PAD_PX;
  const aboveTop = params.selectionTop - gap - params.menuHeight;

  // 상단으로 완전히(또는 pad 기준) 잘리는 경우에만 아래
  if (aboveTop < pad) {
    return {
      placement: "below",
      menuTopViewport: params.selectionBottom + gap,
    };
  }

  return {
    placement: "above",
    menuTopViewport: aboveTop,
  };
}

/**
 * Selection BoundingClientRect 기준으로 메뉴 위치를 계산한다.
 * absolute 부모(Quick Actions 를 감싼 relative 래퍼) 기준 top/left 를 반환한다.
 *
 * positioningParent 를 넘기면 textarea.offsetParent 대신 그 요소를 기준으로 한다.
 * (에디터 내부에 오버레이 래퍼가 생겨 offsetParent 가 어긋나는 경우 대비)
 */
export function estimateQuickActionsPosition(
  el: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number = selectionStart,
  menuWidth = 320,
  menuHeight = 52,
  positioningParent?: HTMLElement | null,
): QuickActionsPosition {
  const parent =
    positioningParent ?? (el.offsetParent as HTMLElement | null);
  const parentRect =
    parent?.getBoundingClientRect() ?? el.getBoundingClientRect();

  const selectionRect = getTextareaSelectionBoundingClientRect(
    el,
    selectionStart,
    selectionEnd,
  );

  const gap = SELECTION_MENU_GAP_PX;
  const pad = SELECTION_MENU_VIEWPORT_PAD_PX;
  // 모바일 키보드 — visualViewport 기준으로 clamp (layout viewport 는 어긋날 수 있음)
  const vv = window.visualViewport;
  const viewportW = vv?.width ?? window.innerWidth;
  const viewportH = vv?.height ?? window.innerHeight;
  const viewportOffsetTop = vv?.offsetTop ?? 0;
  const viewportOffsetLeft = vv?.offsetLeft ?? 0;

  const { placement, menuTopViewport: rawTop } = decideSelectionMenuPlacement({
    selectionTop: selectionRect.top,
    selectionBottom: selectionRect.bottom,
    menuHeight,
    viewportH: viewportH + viewportOffsetTop,
    gap,
    viewportPad: pad + viewportOffsetTop,
  });

  // 하단으로 완전히 벗어나지 않도록만 clamp (기본 placement 는 유지)
  const menuTopViewport = clamp(
    rawTop,
    pad + viewportOffsetTop,
    Math.max(
      pad + viewportOffsetTop,
      viewportOffsetTop + viewportH - menuHeight - pad,
    ),
  );

  // 수평: 선택 중앙 정렬 — 메뉴가 viewport 보다 넓으면 왼쪽부터 보이게
  const usableMenuWidth = Math.min(menuWidth, viewportW - pad * 2);
  const selectionCenterX = selectionRect.left + selectionRect.width / 2;
  let menuLeftViewport = selectionCenterX - usableMenuWidth / 2;
  menuLeftViewport = clamp(
    menuLeftViewport,
    pad + viewportOffsetLeft,
    Math.max(
      pad + viewportOffsetLeft,
      viewportOffsetLeft + viewportW - usableMenuWidth - pad,
    ),
  );

  return {
    top: menuTopViewport - parentRect.top,
    left: menuLeftViewport - parentRect.left,
    viewportTop: menuTopViewport,
    viewportLeft: menuLeftViewport,
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
