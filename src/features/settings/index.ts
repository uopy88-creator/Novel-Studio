/**
 * Settings — 앱 전역 설정
 */

export { SettingsPage } from "./components/SettingsPage";
export type { SettingsPageProps } from "./components/SettingsPage";
export { SettingsProvider, useUserSettings } from "./context/SettingsProvider";
export type {
  UserSettings,
  FontSizePref,
  EditorWidthPref,
  ThemePref,
} from "./types/user-settings";
export type { ProjectSettings, WordCountMode } from "./types/project-settings";
