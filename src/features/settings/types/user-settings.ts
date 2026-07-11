/**
 * =============================================================================
 * UserSettings (앱 전역 설정)
 * -----------------------------------------------------------------------------
 * 계정·테마·에디터 선호 등. ProjectSettings(작품별)와 분리한다.
 * LocalStorage 에 저장한다 (기기별 선호).
 * =============================================================================
 */

import type {
  ExportFormat,
  ExportOptions,
  ExportScope,
} from "@/features/export/types/export-options";
import { DEFAULT_EXPORT_OPTIONS } from "@/features/export/types/export-options";

/** 원고 에디터 글자 크기 */
export type FontSizePref = "sm" | "md" | "lg";

/** 원고 에디터 최대 폭 */
export type EditorWidthPref = "narrow" | "medium" | "wide";

/** 자동 저장 간격(초) */
export type AutosaveIntervalSeconds = 1 | 2 | 3 | 5;

/** 테마 */
export type ThemePref = "light" | "dark";

/** Export 기본값 (모달을 열 때 초기값) */
export interface ExportDefaultsPref extends ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
}

export interface UserSettings {
  fontSize: FontSizePref;
  editorWidth: EditorWidthPref;
  autosaveIntervalSeconds: AutosaveIntervalSeconds;
  theme: ThemePref;
  exportDefaults: ExportDefaultsPref;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  fontSize: "md",
  editorWidth: "wide",
  autosaveIntervalSeconds: 1,
  theme: "light",
  exportDefaults: {
    ...DEFAULT_EXPORT_OPTIONS,
    format: "docx",
    scope: "manuscript",
  },
};

export const FONT_SIZE_LABELS: Record<FontSizePref, string> = {
  sm: "작게",
  md: "보통",
  lg: "크게",
};

export const EDITOR_WIDTH_LABELS: Record<EditorWidthPref, string> = {
  narrow: "좁게",
  medium: "보통",
  wide: "넓게",
};

export const AUTOSAVE_LABELS: Record<AutosaveIntervalSeconds, string> = {
  1: "1초",
  2: "2초",
  3: "3초",
  5: "5초",
};

export const THEME_LABELS: Record<ThemePref, string> = {
  light: "라이트",
  dark: "다크",
};

/** 에디터에 적용할 rem 크기 */
export const FONT_SIZE_REM: Record<FontSizePref, string> = {
  sm: "0.9375rem",
  md: "1rem",
  lg: "1.125rem",
};

/** Manuscript 컨테이너 max-width 클래스 */
export const EDITOR_WIDTH_CLASS: Record<EditorWidthPref, string> = {
  narrow: "max-w-3xl",
  medium: "max-w-5xl",
  wide: "max-w-7xl",
};
