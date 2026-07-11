/**
 * =============================================================================
 * UserSettings LocalStorage
 * =============================================================================
 */

import type {
  AutosaveIntervalSeconds,
  EditorWidthPref,
  ExportDefaultsPref,
  FontSizePref,
  ThemePref,
  UserSettings,
} from "@/features/settings/types/user-settings";
import { DEFAULT_USER_SETTINGS } from "@/features/settings/types/user-settings";
import { DEFAULT_EXPORT_OPTIONS } from "@/features/export/types/export-options";
import { USER_SETTINGS_STORAGE_KEY } from "@/lib/storage/keys";
import {
  readStorageString,
  writeStorageString,
} from "@/lib/storage/browser";

export { USER_SETTINGS_STORAGE_KEY };

function isFontSize(v: unknown): v is FontSizePref {
  return v === "sm" || v === "md" || v === "lg";
}

function isEditorWidth(v: unknown): v is EditorWidthPref {
  return v === "narrow" || v === "medium" || v === "wide";
}

function isAutosave(v: unknown): v is AutosaveIntervalSeconds {
  return v === 1 || v === 2 || v === 3 || v === 5;
}

function isTheme(v: unknown): v is ThemePref {
  return v === "light" || v === "dark";
}

function normalizeExportDefaults(raw: unknown): ExportDefaultsPref {
  const base = DEFAULT_USER_SETTINGS.exportDefaults;
  if (!raw || typeof raw !== "object") return { ...base };
  const o = raw as Record<string, unknown>;
  return {
    format: o.format === "txt" || o.format === "pdf" || o.format === "docx"
      ? o.format
      : base.format,
    scope:
      o.scope === "manuscript" || o.scope === "scenes" || o.scope === "project"
        ? o.scope
        : base.scope,
    includeSceneDelimiters:
      typeof o.includeSceneDelimiters === "boolean"
        ? o.includeSceneDelimiters
        : DEFAULT_EXPORT_OPTIONS.includeSceneDelimiters,
    excludeSceneMemos:
      typeof o.excludeSceneMemos === "boolean"
        ? o.excludeSceneMemos
        : DEFAULT_EXPORT_OPTIONS.excludeSceneMemos,
    excludeWritingVault:
      typeof o.excludeWritingVault === "boolean"
        ? o.excludeWritingVault
        : DEFAULT_EXPORT_OPTIONS.excludeWritingVault,
    includeInspirationNotes:
      typeof o.includeInspirationNotes === "boolean"
        ? o.includeInspirationNotes
        : DEFAULT_EXPORT_OPTIONS.includeInspirationNotes,
  };
}

function normalize(raw: Partial<UserSettings> | null): UserSettings {
  if (!raw) return { ...DEFAULT_USER_SETTINGS, exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults } };
  return {
    fontSize: isFontSize(raw.fontSize) ? raw.fontSize : DEFAULT_USER_SETTINGS.fontSize,
    editorWidth: isEditorWidth(raw.editorWidth)
      ? raw.editorWidth
      : DEFAULT_USER_SETTINGS.editorWidth,
    autosaveIntervalSeconds: isAutosave(raw.autosaveIntervalSeconds)
      ? raw.autosaveIntervalSeconds
      : DEFAULT_USER_SETTINGS.autosaveIntervalSeconds,
    theme: isTheme(raw.theme) ? raw.theme : DEFAULT_USER_SETTINGS.theme,
    exportDefaults: normalizeExportDefaults(raw.exportDefaults),
  };
}

/** 동기 읽기 — SSR/하이드레이션 전엔 기본값 */
export function readUserSettings(): UserSettings {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_USER_SETTINGS,
      exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults },
    };
  }
  const raw = readStorageString(USER_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return {
      ...DEFAULT_USER_SETTINGS,
      exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults },
    };
  }
  try {
    return normalize(JSON.parse(raw) as Partial<UserSettings>);
  } catch {
    return {
      ...DEFAULT_USER_SETTINGS,
      exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults },
    };
  }
}

export function writeUserSettings(settings: UserSettings): void {
  writeStorageString(USER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function patchUserSettings(
  patch: Partial<UserSettings>,
): UserSettings {
  const next = normalize({ ...readUserSettings(), ...patch });
  writeUserSettings(next);
  return next;
}

/** 자동 저장 디바운스 ms */
export function readAutosaveMs(): number {
  return readUserSettings().autosaveIntervalSeconds * 1000;
}
