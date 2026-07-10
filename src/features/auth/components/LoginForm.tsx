"use client";

/**
 * =============================================================================
 * LoginForm
 * -----------------------------------------------------------------------------
 * 이메일 · 비밀번호만. SNS / 닉네임 / 프로필 없음.
 *
 * iOS Safari 자동완성 대응
 * - controlled input (value + state)
 * - onChange + onInput 모두 state 갱신
 * - autocomplete: email / current-password
 * =============================================================================
 */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthProvider";
import { authService } from "@/services/auth-service";
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

export function LoginForm() {
  const { signIn, isSupabaseReady } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Safari 자동완성은 onChange 대신 onInput 만 오는 경우가 있다 */
  function onEmailInput(event: FormEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value);
  }

  function onPasswordInput(event: FormEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(ENV_MISSING_MESSAGE);
      return;
    }

    // 제출 직전 DOM 값으로 state를 한 번 더 맞춤 (자동완성 누락 대비)
    const form = event.currentTarget;
    const emailInput = form.elements.namedItem("email");
    const passwordInput = form.elements.namedItem("password");
    const emailValue =
      emailInput instanceof HTMLInputElement ? emailInput.value : email;
    const passwordValue =
      passwordInput instanceof HTMLInputElement ? passwordInput.value : password;

    setEmail(emailValue);
    setPassword(passwordValue);

    const providerName = authService.getProviderName();
    const providerExists = authService.hasProvider();

    console.log("[Novel Studio Auth] before signIn", {
      emailLength: emailValue.trim().length,
      passwordLength: passwordValue.trim().length,
      providerExists,
      providerName,
    });

    setSubmitting(true);
    try {
      // 로그인 버튼 시점에 authService → provider → Supabase client
      await signIn({ email: emailValue, password: passwordValue });
      router.replace("/");
    } catch (err) {
      console.error("[Novel Studio Auth] LoginForm caught", err);
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
            autoComplete="current-password"
            value={password}
            onChange={onPasswordInput}
            onInput={onPasswordInput}
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
