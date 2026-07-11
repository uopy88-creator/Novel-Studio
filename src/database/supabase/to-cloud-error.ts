/**
 * Supabase / Postgrest 오류를 Error 로 정규화한다.
 * (PostgrestError 는 instanceof Error 가 아닐 수 있음)
 */
export function toCloudError(error: unknown, fallback = "클라우드 저장에 실패했습니다."): Error {
  if (error instanceof Error) return error;

  if (error && typeof error === "object") {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [
      typeof record.message === "string" ? record.message : null,
      typeof record.details === "string" ? record.details : null,
      typeof record.hint === "string" ? record.hint : null,
      typeof record.code === "string" ? `code=${record.code}` : null,
    ].filter(Boolean);
    if (parts.length > 0) {
      return new Error(parts.join(" · "));
    }
  }

  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }

  return new Error(fallback);
}
