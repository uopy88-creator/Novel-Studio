/**
 * =============================================================================
 * GET /api/dictionary?q=
 * -----------------------------------------------------------------------------
 * 표준국어대사전 Open API (STDICT_API_KEY) → 로컬 폴백.
 * 응답은 { query, definition, source } — 뜻만.
 * =============================================================================
 */

import { NextResponse } from "next/server";
import { lookupLocalDefinition } from "@/features/sentence-assistant/lib/local-dictionary";
import { normalizeDictionaryQuery } from "@/features/sentence-assistant/lib/normalize-query";

export const runtime = "nodejs";

interface StdictSense {
  definition?: string;
}

interface StdictItem {
  word?: string;
  sense?: StdictSense | StdictSense[];
}

interface StdictChannel {
  item?: StdictItem | StdictItem[];
}

function firstDefinitionFromStdict(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as { channel?: StdictChannel };
  const channel = root.channel;
  if (!channel) return null;

  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  for (const item of items) {
    const senses = Array.isArray(item.sense)
      ? item.sense
      : item.sense
        ? [item.sense]
        : [];
    for (const sense of senses) {
      const def = sense.definition?.trim();
      if (def) return def;
    }
  }
  return null;
}

async function lookupStdict(query: string, apiKey: string): Promise<string | null> {
  const url =
    `https://stdict.korean.go.kr/api/search.do` +
    `?key=${encodeURIComponent(apiKey)}` +
    `&type_search=search` +
    `&req_type=json` +
    `&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    // 서버에서만 호출 — 키 노출 방지
    cache: "no-store",
  });

  if (!response.ok) return null;

  const text = await response.text();
  if (!text.trim()) return null;

  try {
    const json = JSON.parse(text) as unknown;
    return firstDefinitionFromStdict(json);
  } catch {
    // 일부 환경은 XML만 반환 — 간단 파싱
    const match = text.match(/<definition>([\s\S]*?)<\/definition>/i);
    if (match?.[1]) {
      return match[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() || null;
    }
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeDictionaryQuery(searchParams.get("q") ?? "");

  if (!query) {
    return NextResponse.json(
      { query: "", definition: null, source: null },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.STDICT_API_KEY?.trim() ||
    process.env.KOREAN_DICT_API_KEY?.trim() ||
    "";

  if (apiKey) {
    try {
      const definition = await lookupStdict(query, apiKey);
      if (definition) {
        return NextResponse.json({
          query,
          definition,
          source: "표준국어대사전",
        });
      }
    } catch (error) {
      console.error("[api/dictionary] stdict failed", error);
    }
  }

  const local = lookupLocalDefinition(query);
  if (local) {
    return NextResponse.json({
      query,
      definition: local,
      source: "로컬 사전",
    });
  }

  return NextResponse.json({
    query,
    definition: null,
    source: null,
  });
}
