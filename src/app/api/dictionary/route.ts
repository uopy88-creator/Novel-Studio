/**
 * =============================================================================
 * GET /api/dictionary?q=
 * -----------------------------------------------------------------------------
 * 국립국어원 표준국어대사전 Open API (STDICT_API_KEY).
 * AI·로컬 폴백 없이 국어원 API만 사용한다.
 *
 * Request params:
 *   key, q, req_type=json, start=1, num
 *
 * 참고: 공식 규격상 num 허용 범위는 10~100.
 *       num=10 으로 요청한 뒤 응답 안에서 의미(sense)를 최대 2개까지 추출한다.
 *       추가 API 호출은 하지 않는다.
 * =============================================================================
 */

import { NextResponse } from "next/server";
import type { DictionaryEntry } from "@/features/sentence-assistant/engines/dictionary/dictionary-types";
import { parseStdictEntry } from "@/features/sentence-assistant/engines/dictionary/parse-stdict";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export const runtime = "nodejs";

const STDICT_SEARCH_URL = "https://stdict.korean.go.kr/api/search.do";

/** API 규격 최솟값 — 한 응답에서 sense 를 최대 2개 추출 */
const STDICT_NUM = "10";

class StdictUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StdictUpstreamError";
  }
}

/** XML 에러 본문에서 코드 추출 (키 오류 등) */
function readStdictXmlError(text: string): string | null {
  const code = text.match(/<error_code>\s*([^<]+)\s*<\/error_code>/i)?.[1]?.trim();
  const message = text.match(/<\/error_code>\s*([^<\n]+)/i)?.[1]?.trim();
  if (!code && !message) return null;
  return `STDICT error_code=${code ?? "?"} ${message ?? ""}`.trim();
}

/**
 * 표준국어대사전 검색 — 한 응답에서 의미 최대 2개.
 */
async function lookupStdict(
  query: string,
  apiKey: string,
): Promise<DictionaryEntry | null> {
  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    req_type: "json",
    start: "1",
    num: STDICT_NUM,
  });
  const url = `${STDICT_SEARCH_URL}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new StdictUpstreamError(
      `STDICT auth error: HTTP ${response.status}`,
    );
  }
  if (response.status === 429) {
    throw new StdictUpstreamError("STDICT rate limit: HTTP 429");
  }
  if (!response.ok) {
    throw new StdictUpstreamError(`STDICT HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  const xmlError = readStdictXmlError(text);
  if (xmlError) {
    throw new StdictUpstreamError(xmlError);
  }

  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch (error) {
    throw new StdictUpstreamError(
      `STDICT JSON parse failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return parseStdictEntry(json, query);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeDictionaryQuery(searchParams.get("q") ?? "");

  if (!query) {
    return NextResponse.json(
      { status: "error", query: "", message: "query required" },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.STDICT_API_KEY?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!apiKey) {
    console.error("[api/dictionary] STDICT_API_KEY is not set");
    return NextResponse.json(
      { status: "error", query },
      { status: 503 },
    );
  }

  try {
    const entry = await lookupStdict(query, apiKey);
    if (!entry) {
      return NextResponse.json({ status: "not_found", query });
    }
    return NextResponse.json({ status: "found", query, entry });
  } catch (error) {
    console.error("[api/dictionary] stdict failed", error);
    return NextResponse.json(
      { status: "error", query },
      { status: 502 },
    );
  }
}
