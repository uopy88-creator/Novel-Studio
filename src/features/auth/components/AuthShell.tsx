"use client";

/**
 * 로그인 / 회원가입 공통 레이아웃 — 미니멀 흰 배경 중앙 정렬.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-ns-canvas px-ns-6 py-ns-10">
      {children}
    </div>
  );
}
