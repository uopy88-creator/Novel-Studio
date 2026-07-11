/**
 * =============================================================================
 * 테마 · 에디터 CSS 변수 적용
 * =============================================================================
 */

import type { UserSettings } from "@/features/settings/types/user-settings";
import { FONT_SIZE_REM } from "@/features/settings/types/user-settings";

/** documentElement 에 테마·에디터 변수를 반영한다. */
export function applyUserSettingsToDom(settings: UserSettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (settings.theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }

  root.style.setProperty(
    "--ns-editor-font-size",
    FONT_SIZE_REM[settings.fontSize],
  );
}
