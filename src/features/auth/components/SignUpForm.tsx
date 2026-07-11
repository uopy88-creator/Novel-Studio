"use client";

/**
 * =============================================================================
 * SignUpForm
 * -----------------------------------------------------------------------------
 * iOS Safari 자동완성 대응: controlled + onChange/onInput
 * =============================================================================
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const ENV_MISSING_MESSAGE = "Supabase 환경변수가 설정되지 않았습니다.";

export function SignUpForm() {
  const { signUp, isSupabaseReady } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onEmailInput(event: FormEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value);
  }

  function onPasswordInput(event: FormEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  function onPasswordConfirmInput(event: FormEvent<HTMLInputElement>) {
    setPasswordConfirm(event.currentTarget.value);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured()) {
      setError(ENV_MISSING_MESSAGE);
      return;
    }

    const form = event.currentTarget;
    const emailEl = form.elements.namedItem("email");
    const passwordEl = form.elements.namedItem("password");
    const confirmEl = form.elements.namedItem("passwordConfirm");

    const emailValue =
      emailEl instanceof HTMLInputElement ? emailEl.value : email;
    const passwordValue =
      passwordEl instanceof HTMLInputElement ? passwordEl.value : password;
    const confirmValue =
      confirmEl instanceof HTMLInputElement ? confirmEl.value : passwordConfirm;

    setEmail(emailValue);
    setPassword(passwordValue);
    setPasswordConfirm(confirmValue);

    if (passwordValue.trim() !== confirmValue.trim()) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    console.log("[Novel Studio Auth] before signUp", {
      emailLength: emailValue.trim().length,
      passwordLength: passwordValue.trim().length,
    });

    setSubmitting(true);
    try {
      await signUp({ email: emailValue, password: passwordValue });
      router.replace("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "회원가입에 실패했습니다.";
      console.log("[Novel Studio Auth] SignUpForm caught message:", message);
      console.error("[Novel Studio Auth] SignUpForm caught", err);

      // 이메일 인증 안내(가입은 성공)는 빨간 에러가 아니라 안내로 표시
      if (message.includes("가입은 완료되었습니다")) {
        setInfo(message);
        setError(null);
      } else {
        setError(message);
      }
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
            {ENV_MISSING_MESSAGE}
          </p>
        ) : null}
        <form className="flex flex-col gap-ns-4" onSubmit={onSubmit} noValidate>
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
            onChange={onEmailInput}
            onInput={onEmailInput}
            placeholder="you@example.com"
            required
          />
          <Input
            label="비밀번호"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={onPasswordInput}
            onInput={onPasswordInput}
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
            onChange={onPasswordConfirmInput}
            onInput={onPasswordConfirmInput}
            placeholder="비밀번호를 다시 입력"
            required
            minLength={6}
          />
          {error ? (
            <p className="text-ns-sm text-ns-danger" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p
              className="rounded-ns-md border border-ns-accent-border bg-ns-accent-soft px-ns-4 py-ns-3 text-ns-sm text-ns-ink"
              role="status"
            >
              {info}
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
