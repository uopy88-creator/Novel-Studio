/**
 * Supabase / Postgrest 오류를 Error 로 정규화한다.
 * (PostgrestError 는 instanceof Error 가 아닐 수 있음)
 */

function readErrorParts(error: unknown): {
  message: string;
  details: string;
  hint: string;
  code: string;
} {
  if (error instanceof Error) {
    return { message: error.message, details: "", hint: "", code: "" };
  }
  if (error && typeof error === "object") {
    const record = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    return {
      message: typeof record.message === "string" ? record.message : "",
      details: typeof record.details === "string" ? record.details : "",
      hint: typeof record.hint === "string" ? record.hint : "",
      code: typeof record.code === "string" ? record.code : "",
    };
  }
  if (typeof error === "string") {
    return { message: error, details: "", hint: "", code: "" };
  }
  return { message: "", details: "", hint: "", code: "" };
}

/** 미적용 마이그레이션(테이블 없음) → 한글 안내 */
function friendlyMissingTableMessage(parts: {
  message: string;
  details: string;
  hint: string;
  code: string;
}): string | null {
  const blob = `${parts.message} ${parts.details} ${parts.hint} ${parts.code}`;
  const isMissingTable =
    parts.code === "PGRST205" ||
    /Could not find the table/i.test(blob) ||
    (/schema cache/i.test(blob) && /table/i.test(blob));

  if (!isMissingTable) return null;

  if (/timeline_events/i.test(blob)) {
    return (
      "Timeline 테이블(public.timeline_events)이 Supabase에 없습니다. " +
      "Supabase → SQL Editor에서 supabase/migrations/20260711000005_timeline_events.sql " +
      "내용을 실행한 뒤 페이지를 새로고침하세요."
    );
  }

  const tableMatch = blob.match(/public\.([a-z0-9_]+)/i);
  if (tableMatch) {
    return (
      `필요한 테이블(public.${tableMatch[1]})이 Supabase에 없습니다. ` +
      "Supabase → SQL Editor에서 해당 migration SQL을 실행해 주세요."
    );
  }

  return (
    "필요한 데이터베이스 테이블이 Supabase에 없습니다. " +
    "Supabase → SQL Editor에서 supabase/migrations/ 안의 미적용 SQL을 실행해 주세요."
  );
}

export function toCloudError(
  error: unknown,
  fallback = "클라우드 저장에 실패했습니다.",
): Error {
  const parts = readErrorParts(error);
  const friendly = friendlyMissingTableMessage(parts);
  if (friendly) return new Error(friendly);

  if (error instanceof Error) return error;

  const joined = [
    parts.message || null,
    parts.details || null,
    parts.hint || null,
    parts.code ? `code=${parts.code}` : null,
  ].filter(Boolean);

  if (joined.length > 0) {
    return new Error(joined.join(" · "));
  }

  if (typeof error === "string" && error.trim()) {
    return new Error(error);
  }

  return new Error(fallback);
}
