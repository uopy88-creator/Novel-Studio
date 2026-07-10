"use client";

/**
 * =============================================================================
 * AuthGate
 * -----------------------------------------------------------------------------
 * 비로그인 → /login, 로그인 상태에서 /login·/signup → /
 * =============================================================================
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/signup"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = PUBLIC_AUTH_PATHS.has(pathname);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "anonymous" && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && isAuthPage) {
      router.replace("/");
    }
  }, [status, isAuthPage, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ns-canvas">
        <p className="text-ns-sm text-ns-ink-tertiary">불러오는 중…</p>
      </div>
    );
  }

  if (status === "anonymous" && !isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ns-canvas">
        <p className="text-ns-sm text-ns-ink-tertiary">로그인 화면으로 이동 중…</p>
      </div>
    );
  }

  if (status === "authenticated" && isAuthPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ns-canvas">
        <p className="text-ns-sm text-ns-ink-tertiary">작품 목록으로 이동 중…</p>
      </div>
    );
  }

  return <>{children}</>;
}
