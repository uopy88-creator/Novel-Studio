"use client";

/**
 * =============================================================================
 * SettingsPage
 * -----------------------------------------------------------------------------
 * 폰트 · 에디터 폭 · 자동 저장 · 다크 모드 · Export 기본값 ·
 * 단축키 · 백업/복원 · 계정 · 로그아웃
 * =============================================================================
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth";
import type { ProjectId } from "@/types/ids";
import { useUserSettings } from "@/features/settings/context/SettingsProvider";
import {
  SettingsChoiceGroup,
  SettingsSection,
} from "@/features/settings/components/SettingsSection";
import { ShortcutsPanel } from "@/features/settings/components/ShortcutsPanel";
import {
  AUTOSAVE_LABELS,
  EDITOR_WIDTH_LABELS,
  FONT_SIZE_LABELS,
  THEME_LABELS,
  type AutosaveIntervalSeconds,
  type EditorWidthPref,
  type FontSizePref,
  type ThemePref,
} from "@/features/settings/types/user-settings";
import {
  downloadBackupFile,
  parseBackupFile,
  restoreBackupFile,
} from "@/features/settings/lib/backup-file";
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_SCOPE_LABELS,
  type ExportFormat,
  type ExportScope,
} from "@/features/export/types/export-options";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

export interface SettingsPageProps {
  projectId: ProjectId;
}

export function SettingsPage({ projectId }: SettingsPageProps) {
  const router = useRouter();
  const { user, signOut, isSupabaseReady } = useAuth();
  const { settings, updateSettings, resetSettings } = useUserSettings();

  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // projectId 는 작품 작업실 경로에서 열리며, 향후 작품별 설정 확장에 사용
  void projectId;

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (err) {
      console.error("[Settings] signOut failed", err);
      setSigningOut(false);
    }
  };

  const handleRestore = async (file: File) => {
    setBackupError(null);
    setBackupMessage(null);
    try {
      const text = await file.text();
      const parsed = parseBackupFile(text);
      restoreBackupFile(parsed);
      setBackupMessage(
        "로컬 백업을 복원했습니다. 클라우드 모드에서는 다음 동기화에 주의하세요. 페이지를 새로고침합니다…",
      );
      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : "복원에 실패했습니다.",
      );
    }
  };

  return (
    <ContentContainer width="default">
      <header className="mb-ns-8">
        <p className="ns-caption mb-ns-2">환경</p>
        <h2 className="ns-heading">Settings</h2>
        <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
          에디터·테마·Export·백업을 이 기기에서 관리합니다.
        </p>
      </header>

      <div className="flex flex-col gap-ns-4">
        {/* 에디터 */}
        <SettingsSection
          title="에디터"
          description="원고 화면의 글자 크기와 폭입니다."
        >
          <div className="flex flex-col gap-ns-4">
            <SettingsChoiceGroup
              label="폰트 크기"
              value={settings.fontSize}
              options={(Object.keys(FONT_SIZE_LABELS) as FontSizePref[]).map(
                (value) => ({ value, label: FONT_SIZE_LABELS[value] }),
              )}
              onChange={(fontSize) => updateSettings({ fontSize })}
            />
            <SettingsChoiceGroup
              label="에디터 폭"
              value={settings.editorWidth}
              options={(
                Object.keys(EDITOR_WIDTH_LABELS) as EditorWidthPref[]
              ).map((value) => ({
                value,
                label: EDITOR_WIDTH_LABELS[value],
              }))}
              onChange={(editorWidth) => updateSettings({ editorWidth })}
            />
            <SettingsChoiceGroup
              label="자동 저장 간격"
              value={settings.autosaveIntervalSeconds}
              options={(
                [1, 2, 3, 5] as AutosaveIntervalSeconds[]
              ).map((value) => ({
                value,
                label: AUTOSAVE_LABELS[value],
              }))}
              onChange={(autosaveIntervalSeconds) =>
                updateSettings({ autosaveIntervalSeconds })
              }
            />
          </div>
        </SettingsSection>

        {/* 테마 */}
        <SettingsSection
          title="다크 모드"
          description="화면 테마를 전환합니다. 이 기기에만 저장됩니다."
        >
          <SettingsChoiceGroup
            label="테마"
            value={settings.theme}
            options={(Object.keys(THEME_LABELS) as ThemePref[]).map(
              (value) => ({ value, label: THEME_LABELS[value] }),
            )}
            onChange={(theme) => updateSettings({ theme })}
          />
        </SettingsSection>

        {/* Export 기본 설정 */}
        <SettingsSection
          title="Export 기본 설정"
          description="Export 모달을 열 때 기본으로 선택되는 값입니다."
        >
          <div className="flex flex-col gap-ns-4">
            <SettingsChoiceGroup
              label="형식"
              value={settings.exportDefaults.format}
              options={(Object.keys(EXPORT_FORMAT_LABELS) as ExportFormat[]).map(
                (value) => ({ value, label: EXPORT_FORMAT_LABELS[value] }),
              )}
              onChange={(format) =>
                updateSettings({
                  exportDefaults: { ...settings.exportDefaults, format },
                })
              }
            />
            <SettingsChoiceGroup
              label="범위"
              value={settings.exportDefaults.scope}
              options={(Object.keys(EXPORT_SCOPE_LABELS) as ExportScope[]).map(
                (value) => ({ value, label: EXPORT_SCOPE_LABELS[value] }),
              )}
              onChange={(scope) =>
                updateSettings({
                  exportDefaults: { ...settings.exportDefaults, scope },
                })
              }
            />
            <div className="flex flex-col gap-ns-2">
              <Checkbox
                checked={settings.exportDefaults.includeSceneDelimiters}
                onChange={(e) =>
                  updateSettings({
                    exportDefaults: {
                      ...settings.exportDefaults,
                      includeSceneDelimiters: e.target.checked,
                    },
                  })
                }
                label="장면 구분자 포함"
              />
              <Checkbox
                checked={settings.exportDefaults.excludeSceneMemos}
                onChange={(e) =>
                  updateSettings({
                    exportDefaults: {
                      ...settings.exportDefaults,
                      excludeSceneMemos: e.target.checked,
                    },
                  })
                }
                label="장면 메모 제외"
              />
              <Checkbox
                checked={settings.exportDefaults.excludeWritingVault}
                onChange={(e) =>
                  updateSettings({
                    exportDefaults: {
                      ...settings.exportDefaults,
                      excludeWritingVault: e.target.checked,
                    },
                  })
                }
                label="Writing Vault 부록 제외"
              />
              <Checkbox
                checked={settings.exportDefaults.includeInspirationNotes}
                onChange={(e) =>
                  updateSettings({
                    exportDefaults: {
                      ...settings.exportDefaults,
                      includeInspirationNotes: e.target.checked,
                    },
                  })
                }
                label="Inspiration 부록 포함"
              />
            </div>
          </div>
        </SettingsSection>

        {/* 단축키 */}
        <SettingsSection title="단축키" description="자주 쓰는 키보드 단축키입니다.">
          <ShortcutsPanel />
        </SettingsSection>

        {/* 백업 / 복원 */}
        <SettingsSection
          title="데이터 백업 · 복원"
          description="이 브라우저의 LocalStorage 백업 스냅샷을 JSON으로 받거나 되돌립니다. 클라우드(Supabase) 데이터와는 별개입니다."
        >
          <div className="flex flex-wrap gap-ns-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBackupError(null);
                downloadBackupFile();
                setBackupMessage("백업 파일을 다운로드했습니다.");
              }}
            >
              백업 다운로드
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              백업에서 복원
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleRestore(file);
              }}
            />
          </div>
          {backupMessage ? (
            <p className="mt-ns-3 text-ns-xs text-ns-ink-secondary">
              {backupMessage}
            </p>
          ) : null}
          {backupError ? (
            <p className="mt-ns-3 text-ns-xs text-ns-danger" role="alert">
              {backupError}
            </p>
          ) : null}
        </SettingsSection>

        {/* 계정 */}
        <SettingsSection
          title="계정 관리"
          description={
            isSupabaseReady
              ? "Supabase Auth 계정입니다."
              : "로컬 인증 모드입니다. Supabase를 연결하면 클라우드 계정으로 전환됩니다."
          }
        >
          <dl className="flex flex-col gap-ns-2 text-ns-sm">
            <div className="flex justify-between gap-ns-3">
              <dt className="text-ns-ink-tertiary">이메일</dt>
              <dd className="truncate text-ns-ink">
                {user?.email ?? "알 수 없음"}
              </dd>
            </div>
            <div className="flex justify-between gap-ns-3">
              <dt className="text-ns-ink-tertiary">인증</dt>
              <dd className="text-ns-ink">
                {isSupabaseReady ? "Supabase" : "Local"}
              </dd>
            </div>
          </dl>
        </SettingsSection>

        {/* 로그아웃 · 초기화 */}
        <SettingsSection title="세션">
          <div className="flex flex-wrap gap-ns-2">
            <Button
              type="button"
              variant="danger"
              disabled={signingOut}
              onClick={() => void handleLogout()}
            >
              {signingOut ? "로그아웃 중…" : "로그아웃"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (
                  window.confirm(
                    "에디터·테마·Export 기본 설정을 초기값으로 되돌릴까요?",
                  )
                ) {
                  resetSettings();
                }
              }}
            >
              설정 초기화
            </Button>
          </div>
        </SettingsSection>
      </div>
    </ContentContainer>
  );
}
