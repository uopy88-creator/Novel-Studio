"use client";

/**
 * =============================================================================
 * LoginForm
 * -----------------------------------------------------------------------------
 * 이메일 · 비밀번호만. SNS / 닉네임 / 프로필 없음.
 * =============================================================================
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const { signIn, isSupabaseReady } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="lg" className="w-full max-w-md">
      <CardHeader className="mb-ns-6 sm:flex-col sm:items-stretch">
        <p className="ns-caption mb-ns-2">Novel Studio</p>
        <CardTitle className="text-ns-2xl">로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호로 작업실에 들어갑니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseReady ? (
          <p
            className="mb-ns-4 rounded-ns-md border border-ns-border bg-ns-muted px-ns-4 py-ns-3 text-ns-sm text-ns-ink-secondary"
            role="status"
          >
            Supabase 환경변수가 없습니다. README의 「Supabase Auth 설정」을 따라
            `.env.local`을 만든 뒤 개발 서버를 다시 시작해 주세요.
          </p>
        ) : null}
        <form className="flex flex-col gap-ns-4" onSubmit={onSubmit}>
          <Input
            label="이메일"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            required
            minLength={6}
          />
          {error ? (
            <p className="text-ns-sm text-ns-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={submitting} size="lg">
            {submitting ? "로그인 중…" : "로그인"}
          </Button>
        </form>
        <p className="mt-ns-6 text-center text-ns-sm text-ns-ink-secondary">
          계정이 없나요?{" "}
          <Link
            href="/signup"
            className="font-medium text-ns-accent hover:text-ns-accent-hover"
          >
            회원가입
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
