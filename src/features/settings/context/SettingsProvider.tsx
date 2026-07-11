"use client";

/**
 * =============================================================================
 * SettingsProvider
 * -----------------------------------------------------------------------------
 * UserSettings 를 읽고 DOM(테마·에디터 폰트)에 반영한다.
 * =============================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserSettings } from "@/features/settings/types/user-settings";
import { DEFAULT_USER_SETTINGS } from "@/features/settings/types/user-settings";
import { applyUserSettingsToDom } from "@/features/settings/lib/apply-theme";
import {
  patchUserSettings,
  readUserSettings,
  writeUserSettings,
} from "@/features/settings/lib/user-settings-storage";

interface SettingsContextValue {
  settings: UserSettings;
  ready: boolean;
  updateSettings: (patch: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => ({
    ...DEFAULT_USER_SETTINGS,
    exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults },
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = readUserSettings();
    setSettings(loaded);
    applyUserSettingsToDom(loaded);
    setReady(true);
  }, []);

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    const next = patchUserSettings(patch);
    setSettings(next);
    applyUserSettingsToDom(next);
  }, []);

  const resetSettings = useCallback(() => {
    const next = {
      ...DEFAULT_USER_SETTINGS,
      exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults },
    };
    writeUserSettings(next);
    setSettings(next);
    applyUserSettingsToDom(next);
  }, []);

  const value = useMemo(
    () => ({ settings, ready, updateSettings, resetSettings }),
    [settings, ready, updateSettings, resetSettings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useUserSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Provider 밖(테스트 등) — 안전한 기본값
    return {
      settings: {
        ...DEFAULT_USER_SETTINGS,
        exportDefaults: { ...DEFAULT_USER_SETTINGS.exportDefaults },
      },
      ready: false,
      updateSettings: () => undefined,
      resetSettings: () => undefined,
    };
  }
  return ctx;
}
