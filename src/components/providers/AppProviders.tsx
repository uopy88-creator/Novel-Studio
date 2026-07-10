"use client";

/**
 * 루트 레이아웃용 클라이언트 래퍼 — Auth 세션 복원 + 라우트 가드.
 */
import { AuthGate, AuthSessionProvider } from "@/auth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <AuthGate>{children}</AuthGate>
    </AuthSessionProvider>
  );
}
