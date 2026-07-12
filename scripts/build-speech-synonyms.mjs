/**
 * Speech Pack 생성기
 * -----------------------------------------------------------------------------
 * `scripts/data/speech-raw.json` 을 읽어 정규화한 뒤
 * `src/data/synonyms/speech.json` 에 UTF-8 로 기록한다.
 *
 * 규칙 (로더·Sentence Assistant 검색과 동일):
 * - 표제어 300개 이상 (말하기·대화·발화 관련)
 * - 단어당 유의어 최대 5개
 * - 가나다순 정렬 (표제어 · 유의어 목록)
 * - 중복·자기참조 제거
 * - 현대 소설에서 자연스러운 표현만 (사투리·고어·비속어·전문용어 제외)
 *
 * 실행: node scripts/build-speech-synonyms.mjs
 *
 * 주의: AI를 사용하지 않는 로컬 유의어 DB 이다.
 * Sentence Assistant 는 `src/data/synonyms/index.ts` 의 speech 카탈로그로 조회한다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PATH = path.join(__dirname, "data/speech-raw.json");
const OUT_PATH = path.join(__dirname, "../src/data/synonyms/speech.json");
const MAX_SYNONYMS = 5;

/** 한국어 가나다순 */
const sortKo = (items) => [...items].sort((a, b) => a.localeCompare(b, "ko"));

/**
 * 한 표제어의 유의어 목록을 정규화한다.
 * - trim / 빈 문자열 제거
 * - 중복 제거
 * - 표제어 자신 제외
 * - 가나다순 + 최대 5개
 */
function normalizeSynonyms(headword, list) {
  const cleaned = [
    ...new Set(
      list
        .map((s) => String(s).trim())
        .filter(Boolean)
        .filter((s) => s !== headword),
    ),
  ];
  return sortKo(cleaned).slice(0, MAX_SYNONYMS);
}

const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
const output = {};

for (const headword of sortKo(
  Object.keys(raw)
    .map((key) => key.trim())
    .filter(Boolean),
)) {
  const synonyms = Array.isArray(raw[headword]) ? raw[headword] : [];
  const normalized = normalizeSynonyms(headword, synonyms);
  if (normalized.length === 0) continue;
  output[headword] = normalized;
}

const headwords = Object.keys(output);

if (headwords.length < 300) {
  throw new Error(`Expected at least 300 headwords, got ${headwords.length}`);
}

if (JSON.stringify(headwords) !== JSON.stringify(sortKo(headwords))) {
  throw new Error("Headwords are not sorted");
}

for (const [headword, synonyms] of Object.entries(output)) {
  if (synonyms.length > MAX_SYNONYMS) {
    throw new Error(`${headword} has more than ${MAX_SYNONYMS} synonyms`);
  }
  if (new Set(synonyms).size !== synonyms.length) {
    throw new Error(`${headword} has duplicate synonyms`);
  }
  if (synonyms.includes(headword)) {
    throw new Error(`${headword} includes itself as a synonym`);
  }
  if (JSON.stringify(synonyms) !== JSON.stringify(sortKo(synonyms))) {
    throw new Error(`${headword} synonyms are not sorted`);
  }
}

fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${headwords.length} speech headwords → ${OUT_PATH}`);
