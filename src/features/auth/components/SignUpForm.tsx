"use client";

/**
 * =============================================================================
 * SignUpForm
 * -----------------------------------------------------------------------------
 * 이메일 · 비밀번호 · 비밀번호 확인만.
 * 성공 시 Supabase 세션이 저장되어 자동 로그인한다.
 *
 * 제출 시 FormData로 DOM 값을 읽는다 (iOS Safari 자동완성 대응).
 * =============================================================================
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";
import { readSignUpFromForm } from "@/auth/lib/read-credentials-from-form";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function SignUpForm() {
  const { signUp, isSupabaseReady } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const values = readSignUpFromForm(event.currentTarget);
    setEmail(values.email);
    setPassword(values.password);
    setPasswordConfirm(values.passwordConfirm);

    if (values.password.trim() !== values.passwordConfirm.trim()) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ email: values.email, password: values.password });
      router.replace("/");
    } catch (err) {
      console.error("[Novel Studio Auth] SignUpForm caught", err);
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="lg" className="w-full max-w-md">
      <CardHeader className="mb-ns-6 sm:flex-col sm:items-stretch">
        <p className="ns-caption mb-ns-2">Novel Studio</p>
        <CardTitle className="text-ns-2xl">회원가입</CardTitle>
        <CardDescription>
          이메일과 비밀번호만으로 계정을 만듭니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseReady ? (
          <p
            className="mb-ns-4 rounded-ns-md border border-ns-border bg-ns-muted px-ns-4 py-ns-3 text-ns-sm text-ns-ink-secondary"
            role="status"
          >
            Supabase 환경변수가 설정되지 않았습니다.
          </p>
        ) : null}
        <form className="flex flex-col gap-ns-4" onSubmit={onSubmit}>
          <Input
            label="이메일"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            required
            minLength={6}
          />
          <Input
            label="비밀번호 확인"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호를 다시 입력"
            required
            minLength={6}
          />
          {error ? (
            <p className="text-ns-sm text-ns-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={submitting} size="lg">
            {submitting ? "가입 중…" : "회원가입"}
          </Button>
        </form>
        <p className="mt-ns-6 text-center text-ns-sm text-ns-ink-secondary">
          이미 계정이 있나요?{" "}
          <Link
            href="/login"
            className="font-medium text-ns-accent hover:text-ns-accent-hover"
          >
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
