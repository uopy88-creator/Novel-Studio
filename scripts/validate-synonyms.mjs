/**
 * =============================================================================
 * Synonym DB 검증기 (개발자 전용)
 * -----------------------------------------------------------------------------
 * `src/data/synonyms/*.json` 전체를 검사한다.
 * 사용자 UI 와는 무관하며, 로컬/CI 에서만 실행한다.
 *
 * 검사 항목:
 * 1. JSON 문법
 * 2. 여러 파일에 걸친 중복 표제어(Key)
 * 3. 유의어 개수 ≤ 5
 * 4. 유의어 가나다순
 * 5. 유의어 목록 내 중복
 * 6. 자기 자신(표제어) 포함 여부
 * 7. 빈 문자열
 * 8. 앞뒤 공백
 * 9. UTF-8 인코딩
 *
 * 실행: npm run validate:synonyms
 * =============================================================================
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYNONYM_DIR = path.join(__dirname, "../src/data/synonyms");
const MAX_SYNONYMS = 5;

/** @typedef {{ file: string, word: string, kind: string, detail?: string }} ValidationError */

/** @type {ValidationError[]} */
const errors = [];

/**
 * 오류를 수집한다. word 가 없으면 "-" 로 표시한다.
 * @param {string} file
 * @param {string} word
 * @param {string} kind
 * @param {string} [detail]
 */
function addError(file, word, kind, detail) {
  errors.push({ file, word: word || "-", kind, detail });
}

/** 한국어 가나다순 정렬 */
function sortKo(items) {
  return [...items].sort((a, b) => a.localeCompare(b, "ko"));
}

/**
 * UTF-8 인코딩 검사.
 * - BOM 이 있으면 오류
 * - Buffer 를 UTF-8 로 디코딩한 뒤 다시 인코딩했을 때 바이트가 달라지면 오류
 * @param {string} fileName
 * @param {Buffer} buf
 */
function validateUtf8(fileName, buf) {
  if (
    buf.length >= 3 &&
    buf[0] === 0xef &&
    buf[1] === 0xbb &&
    buf[2] === 0xbf
  ) {
    addError(fileName, "-", "UTF-8 인코딩", "UTF-8 BOM 이 포함되어 있습니다");
  }

  try {
    const text = buf.toString("utf8");
    // 잘못된 시퀀스는 보통 U+FFFD 로 치환된다. 재인코딩으로 원본과 비교한다.
    const roundTrip = Buffer.from(text, "utf8");
    if (!buf.equals(roundTrip)) {
      addError(
        fileName,
        "-",
        "UTF-8 인코딩",
        "유효하지 않은 UTF-8 바이트가 있습니다",
      );
    }
    if (text.includes("\uFFFD")) {
      addError(
        fileName,
        "-",
        "UTF-8 인코딩",
        "치환 문자(U+FFFD)가 포함되어 있습니다",
      );
    }
    return text;
  } catch {
    addError(fileName, "-", "UTF-8 인코딩", "UTF-8 디코딩에 실패했습니다");
    return null;
  }
}

/**
 * pretty-printed flat JSON 에서 동일 파일 내 중복 키를 찾는다.
 * JSON.parse 는 중복 키를 조용히 덮어쓰므로 텍스트 스캔이 필요하다.
 * @param {string} fileName
 * @param {string} text
 */
function findDuplicateKeysInFile(fileName, text) {
  /** @type {Map<string, number>} */
  const seen = new Map();
  // 2칸 들여쓴 flat 객체 키:   "표제어":
  const re = /^ {2}"((?:\\.|[^"\\])*)"\s*:/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    const key = JSON.parse(`"${match[1]}"`);
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) {
      addError(fileName, key, "중복 Key (파일 내)", "같은 파일에 키가 두 번 이상 있습니다");
    }
  }
}

/**
 * 문자열 값의 빈 문자열·앞뒤 공백을 검사한다.
 * @param {string} fileName
 * @param {string} word 표제어 (값이 표제어 자체면 word 로도 사용)
 * @param {string} value
 * @param {"key" | "synonym"} role
 */
function validateStringValue(fileName, word, value, role) {
  const label = role === "key" ? "표제어" : "유의어";

  if (value === "") {
    addError(fileName, word || "-", "빈 문자열", `${label}이 빈 문자열입니다`);
    return;
  }

  if (value !== value.trim()) {
    addError(
      fileName,
      word || value,
      "공백",
      `${label} 앞뒤에 공백이 있습니다: "${value}"`,
    );
  }
}

/**
 * 한 표제어의 유의어 배열을 검사한다.
 * @param {string} fileName
 * @param {string} headword
 * @param {unknown} list
 */
function validateSynonymList(fileName, headword, list) {
  if (!Array.isArray(list)) {
    addError(fileName, headword, "JSON 구조", "유의어 값이 배열이 아닙니다");
    return;
  }

  if (list.length > MAX_SYNONYMS) {
    addError(
      fileName,
      headword,
      "유의어 개수",
      `${list.length}개 (최대 ${MAX_SYNONYMS}개)`,
    );
  }

  /** @type {string[]} */
  const synonyms = [];
  for (const item of list) {
    if (typeof item !== "string") {
      addError(
        fileName,
        headword,
        "JSON 구조",
        `유의어가 문자열이 아닙니다: ${JSON.stringify(item)}`,
      );
      continue;
    }
    validateStringValue(fileName, headword, item, "synonym");
    synonyms.push(item);
  }

  // 목록 내 중복
  const counts = new Map();
  for (const s of synonyms) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  for (const [s, n] of counts) {
    if (n > 1) {
      addError(
        fileName,
        headword,
        "중복 유의어",
        `"${s}" 가 ${n}번 등장합니다`,
      );
    }
  }

  // 자기 자신
  if (synonyms.includes(headword)) {
    addError(fileName, headword, "자기 자신", "유의어 목록에 표제어가 포함되어 있습니다");
  }

  // 가나다순 (원본 순서 그대로 비교)
  const sorted = sortKo(synonyms);
  if (JSON.stringify(synonyms) !== JSON.stringify(sorted)) {
    addError(
      fileName,
      headword,
      "가나다순",
      `기대 순서: ${JSON.stringify(sorted)}`,
    );
  }
}

/**
 * 카탈로그 파일 하나를 검사하고, 표제어 → 파일 목록 맵에 등록한다.
 * @param {string} fileName
 * @param {string} text
 * @param {Map<string, string[]>} keyOwners
 */
function validateCatalogFile(fileName, text, keyOwners) {
  findDuplicateKeysInFile(fileName, text);

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    addError(fileName, "-", "JSON 문법", message);
    return;
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    addError(fileName, "-", "JSON 구조", "최상위는 객체여야 합니다");
    return;
  }

  for (const [rawKey, list] of Object.entries(data)) {
    const key = String(rawKey);
    validateStringValue(fileName, key, key, "key");

    const owners = keyOwners.get(key) ?? [];
    owners.push(fileName);
    keyOwners.set(key, owners);

    validateSynonymList(fileName, key, list);
  }
}

/**
 * 여러 파일에 같은 표제어가 있으면 오류로 보고한다.
 * @param {Map<string, string[]>} keyOwners
 */
function validateCrossFileDuplicateKeys(keyOwners) {
  for (const [key, files] of keyOwners) {
    if (files.length > 1) {
      addError(
        files.join(", "),
        key,
        "중복 Key (파일 간)",
        `다음 파일에 동시 존재: ${files.join(", ")}`,
      );
    }
  }
}

/** 콘솔에 오류 표를 출력한다. */
function printErrors() {
  console.error("\n❌ Synonym database validation failed.\n");
  console.error(
    `${"파일".padEnd(28)} ${"단어".padEnd(24)} ${"오류 종류".padEnd(20)} 상세`,
  );
  console.error("-".repeat(100));

  for (const e of errors) {
    const file = e.file.slice(0, 27).padEnd(28);
    const word = e.word.slice(0, 23).padEnd(24);
    const kind = e.kind.slice(0, 19).padEnd(20);
    const detail = e.detail ?? "";
    console.error(`${file} ${word} ${kind} ${detail}`);
  }

  console.error(`\n총 ${errors.length}건의 오류가 있습니다.\n`);
}

function main() {
  if (!fs.existsSync(SYNONYM_DIR)) {
    console.error(`Directory not found: ${SYNONYM_DIR}`);
    process.exit(1);
  }

  const jsonFiles = fs
    .readdirSync(SYNONYM_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "en"));

  if (jsonFiles.length === 0) {
    console.error("No synonym JSON files found.");
    process.exit(1);
  }

  /** @type {Map<string, string[]>} */
  const keyOwners = new Map();

  for (const fileName of jsonFiles) {
    const fullPath = path.join(SYNONYM_DIR, fileName);
    const buf = fs.readFileSync(fullPath);
    const text = validateUtf8(fileName, buf);
    if (text === null) continue;
    validateCatalogFile(fileName, text, keyOwners);
  }

  validateCrossFileDuplicateKeys(keyOwners);

  if (errors.length > 0) {
    printErrors();
    process.exit(1);
  }

  console.log("✅ Synonym database validation passed.");
}

main();
