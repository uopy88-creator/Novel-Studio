"use client";

/**
 * 로그인 / 회원가입 공통 레이아웃 — 미니멀 흰 배경 중앙 정렬.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh min-h-screen w-full min-w-0 items-center justify-center bg-ns-canvas px-ns-4 py-ns-8 sm:px-ns-6 sm:py-ns-10">
      {children}
    </div>
  );
}
