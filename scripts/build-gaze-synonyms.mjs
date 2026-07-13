/**
 * Gaze Pack 생성기
 * -----------------------------------------------------------------------------
 * `scripts/data/gaze-raw.json` 을 읽어 정규화한 뒤
 * `src/data/synonyms/gaze.json` 에 UTF-8 로 기록한다.
 *
 * 규칙 (로더·Sentence Assistant 검색과 동일):
 * - 표제어 250개 이상 (시선·보기·눈짓 관련)
 * - 단어당 유의어 최대 5개
 * - 가나다순 정렬 (표제어 · 유의어 목록)
 * - 중복·자기참조 제거
 * - 현대 소설에서 자연스러운 표현만 (사투리·고어·비속어·전문용어 제외)
 *
 * 실행: node scripts/build-gaze-synonyms.mjs
 *
 * 주의: AI를 사용하지 않는 로컬 유의어 DB 이다.
 * Sentence Assistant 는 `src/data/synonyms/index.ts` 의 gaze 카탈로그로 조회한다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PATH = path.join(__dirname, "data/gaze-raw.json");
const OUT_PATH = path.join(__dirname, "../src/data/synonyms/gaze.json");
const MAX_SYNONYMS = 5;
const MIN_HEADWORDS = 250;

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

/**
 * 표제어는 카테고리 간에 중복되면 안 된다 (validate:synonyms).
 * Gaze 보다 우선인 Emotion / Speech 에 이미 있는 키는 제외한다.
 * (Action 쪽 시선 표제어는 Gaze 가 가져가므로 Action 빌드에서 Gaze 를 예약한다.)
 */
function loadOwnedKeys(relativeJsonPath) {
  const full = path.join(__dirname, relativeJsonPath);
  if (!fs.existsSync(full)) return new Set();
  return new Set(Object.keys(JSON.parse(fs.readFileSync(full, "utf8"))));
}

const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
const reserved = new Set([
  ...loadOwnedKeys("../src/data/synonyms/emotion.json"),
  ...loadOwnedKeys("../src/data/synonyms/speech.json"),
]);

const output = {};

for (const headword of sortKo(
  Object.keys(raw)
    .map((key) => key.trim())
    .filter(Boolean),
)) {
  if (reserved.has(headword)) continue;
  const synonyms = Array.isArray(raw[headword]) ? raw[headword] : [];
  const normalized = normalizeSynonyms(headword, synonyms);
  if (normalized.length === 0) continue;
  output[headword] = normalized;
}

const headwords = Object.keys(output);

if (headwords.length < MIN_HEADWORDS) {
  throw new Error(
    `Expected at least ${MIN_HEADWORDS} headwords, got ${headwords.length}`,
  );
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
console.log(`Wrote ${headwords.length} gaze headwords → ${OUT_PATH}`);
