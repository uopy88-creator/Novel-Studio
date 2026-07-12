/**
 * =============================================================================
 * GET /api/dictionary?q=
 * -----------------------------------------------------------------------------
 * 국립국어원 표준국어대사전 Open API (STDICT_API_KEY).
 * AI·로컬 폴백 없이 국어원 API만 사용한다.
 *
 * Request params (검색 옵션 advanced 등은 사용하지 않음):
 *   key, q, req_type=json, start=1, num
 *
 * 참고: 공식 규격상 num 허용 범위는 10~100 이다.
 *       「첫 결과만」쓰라는 요구에 맞춰 num=10 으로 요청한 뒤 item[0] 만 반환한다.
 * =============================================================================
 */

import { NextResponse } from "next/server";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";
import type { DictionaryEntry } from "@/features/sentence-assistant/lib/dictionary-types";

export const runtime = "nodejs";

const STDICT_SEARCH_URL = "https://stdict.korean.go.kr/api/search.do";

/** API 규격 최솟값 — 실질적으로는 첫 결과(item[0])만 사용 */
const STDICT_NUM = "10";

interface StdictSense {
  definition?: string;
  pos?: string;
  link?: string | { [key: string]: unknown };
}

interface StdictItem {
  word?: string;
  pos?: string;
  sense?: StdictSense | StdictSense[];
}

interface StdictChannel {
  total?: number | string;
  item?: StdictItem | StdictItem[];
}

function asLinkString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  // 일부 문서/응답에서 link 가 객체처럼 깨져 오는 경우 방어
  if (value && typeof value === "object") {
    const joined = Object.keys(value as object)
      .join("")
      .trim();
    if (joined.startsWith("http")) return joined;
  }
  return null;
}

/** 첫 번째 item 의 첫 sense → 표시용 엔트리 */
function parseFirstEntry(
  payload: unknown,
  query: string,
): DictionaryEntry | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as { channel?: StdictChannel };
  const channel = root.channel;
  if (!channel) return null;

  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  const item = items[0];
  if (!item) return null;

  const senses = Array.isArray(item.sense)
    ? item.sense
    : item.sense
      ? [item.sense]
      : [];
  const sense = senses[0];
  if (!sense) return null;

  const definition = sense.definition?.trim() ?? "";
  if (!definition) return null;

  const word = (item.word ?? query).trim() || query;
  // 공식 예시: pos 는 item 에, sense 에도 올 수 있음
  const pos = (item.pos?.trim() || sense.pos?.trim() || "") || null;
  const link =
    asLinkString(sense.link) ||
    `https://stdict.korean.go.kr/search/searchResult.do?searchKeyword=${encodeURIComponent(word)}`;

  return {
    query,
    word,
    pos,
    definition,
    link,
  };
}

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
 * 표준국어대사전 검색 — 응답의 첫 결과만 사용.
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
    // 등록되지 않은 검색어일 때 빈 본문을 주는 경우가 있음 → not_found
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

  return parseFirstEntry(json, query);
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

  // 따옴표가 포함된 .env 값도 허용
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
