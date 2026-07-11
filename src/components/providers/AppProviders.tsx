"use client";

/**
 * 루트 레이아웃용 클라이언트 래퍼 — Auth + UserSettings.
 */
import { AuthGate, AuthSessionProvider } from "@/auth";
import { SettingsProvider } from "@/features/settings";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <SettingsProvider>
        <AuthGate>{children}</AuthGate>
      </SettingsProvider>
    </AuthSessionProvider>
  );
}
