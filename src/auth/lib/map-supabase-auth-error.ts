/**
 * =============================================================================
 * Supabase Auth 오류 → 사용자용 한글 메시지
 * -----------------------------------------------------------------------------
 * AuthApiError / 일반 Error 메시지를 화면에서 바로 보여줄 수 있게 변환한다.
 * =============================================================================
 */

import type { AuthError } from "@supabase/supabase-js";

function normalize(message: string): string {
  return message.trim().toLowerCase();
}

/**
 * Supabase Auth 오류를 이해하기 쉬운 한국어로 바꾼다.
 */
export function mapSupabaseAuthError(error: AuthError | Error | unknown): Error {
  if (!error) {
    return new Error("알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  const text = normalize(message);
  const codeLower = code.toLowerCase();

  // 이미 가입된 이메일
  if (
    codeLower === "user_already_exists" ||
    codeLower === "email_exists" ||
    text.includes("already registered") ||
    text.includes("user already registered") ||
    text.includes("email address has already been registered")
  ) {
    return new Error("이미 가입된 이메일입니다. 로그인해 주세요.");
  }

  // 잘못된 이메일 / 비밀번호 (로그인)
  if (
    codeLower === "invalid_credentials" ||
    text.includes("invalid login credentials") ||
    text.includes("invalid credentials")
  ) {
    return new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  // 이메일 형식
  if (
    codeLower === "email_address_invalid" ||
    codeLower === "validation_failed" ||
    text.includes("unable to validate email") ||
    text.includes("invalid email") ||
    (text.includes("email address") && text.includes("invalid"))
  ) {
    return new Error("올바른 이메일 주소를 입력해 주세요.");
  }

  // 비밀번호 규칙
  if (
    codeLower === "weak_password" ||
    text.includes("password should be at least") ||
    text.includes("password is known to be weak") ||
    (text.includes("password") && text.includes("at least 6"))
  ) {
    return new Error("비밀번호는 6자 이상이어야 합니다.");
  }

  // 이메일 미확인
  if (
    codeLower === "email_not_confirmed" ||
    text.includes("email not confirmed")
  ) {
    return new Error(
      "이메일 인증이 필요합니다. 받은편지함의 확인 링크를 눌러 주세요.",
    );
  }

  // 요청 과다
  if (
    codeLower === "over_request_rate_limit" ||
    text.includes("rate limit") ||
    text.includes("too many requests")
  ) {
    return new Error("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
  }

  // 네트워크
  if (
    text.includes("failed to fetch") ||
    text.includes("network") ||
    text.includes("fetch")
  ) {
    return new Error(
      "서버에 연결할 수 없습니다. 인터넷 연결과 Supabase URL을 확인해 주세요.",
    );
  }

  if (message) {
    return new Error(message);
  }

  return new Error("요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
}
