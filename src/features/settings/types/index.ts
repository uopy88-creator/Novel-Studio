/**
 * Settings 도메인 타입 진입점.
 */
export type { ProjectSettings, WordCountMode } from "./project-settings";
export type {
  UserSettings,
  FontSizePref,
  EditorWidthPref,
  ThemePref,
  AutosaveIntervalSeconds,
  ExportDefaultsPref,
} from "./user-settings";
export {
  DEFAULT_USER_SETTINGS,
  FONT_SIZE_LABELS,
  EDITOR_WIDTH_LABELS,
  AUTOSAVE_LABELS,
  THEME_LABELS,
  FONT_SIZE_REM,
  EDITOR_WIDTH_CLASS,
} from "./user-settings";
