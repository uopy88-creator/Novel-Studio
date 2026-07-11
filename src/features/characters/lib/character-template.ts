/**
 * =============================================================================
 * Character freeform profile template
 * -----------------------------------------------------------------------------
 * 새 캐릭터 생성 시 에디터에 넣는 기본 본문.
 * 사용자는 항목을 자유롭게 수정·삭제·추가할 수 있다.
 * =============================================================================
 */

/** 새 캐릭터 기본 템플릿 */
export const CHARACTER_CONTENT_TEMPLATE = [
  "이름 :",
  "별명 :",
  "나이 :",
  "직업 :",
  "외형 :",
  "성격 :",
  "말버릇 :",
  "목표 :",
  "비밀 :",
  "현재 상태 :",
  "메모 :",
].join("\n");

const DEFAULT_CHARACTER_NAME = "새 캐릭터";

/**
 * `라벨 : 값` 한 줄에서 값을 읽는다.
 * 라벨은 줄 시작 기준, 콜론 앞뒤 공백 허용.
 */
export function parseCharacterField(
  content: string,
  label: string,
): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}\\s*:\\s*(.*)$`, "m");
  const match = content.match(pattern);
  return match?.[1]?.trim() ?? "";
}

/** 본문의 `이름 :` 값을 멘션·목록용 이름으로 사용 */
export function extractCharacterName(content: string): string {
  const fromContent = parseCharacterField(content, "이름");
  return fromContent || DEFAULT_CHARACTER_NAME;
}

/** 카드 부제 — 별명 → 직업 → 기본 */
export function extractCharacterSubtitle(content: string): string {
  return (
    parseCharacterField(content, "별명") ||
    parseCharacterField(content, "직업") ||
    "프로필"
  );
}

/** 카드 보조 줄 — 직업 (별명과 다를 때만) */
export function extractCharacterOccupation(content: string): string {
  const nickname = parseCharacterField(content, "별명");
  const occupation = parseCharacterField(content, "직업");
  if (!occupation) return "";
  if (nickname && occupation === nickname) return "";
  return occupation;
}

/**
 * 구 구조화 필드를 자유 본문으로 옮긴다.
 * content가 이미 있으면 그대로 둔다.
 */
export function buildContentFromLegacyFields(fields: {
  name?: string;
  role?: string;
  age?: string;
  gender?: string;
  occupation?: string;
  personality?: string;
  goal?: string;
  secret?: string;
  memo?: string;
}): string {
  const lines = [
    `이름 : ${fields.name?.trim() ?? ""}`.trimEnd(),
    `별명 : ${fields.role?.trim() ?? ""}`.trimEnd(),
    `나이 : ${fields.age?.trim() ?? ""}`.trimEnd(),
    `직업 : ${fields.occupation?.trim() ?? ""}`.trimEnd(),
    "외형 :",
    `성격 : ${fields.personality?.trim() ?? ""}`.trimEnd(),
    "말버릇 :",
    `목표 : ${fields.goal?.trim() ?? ""}`.trimEnd(),
    `비밀 : ${fields.secret?.trim() ?? ""}`.trimEnd(),
    "현재 상태 :",
    `메모 : ${fields.memo?.trim() ?? ""}`.trimEnd(),
  ];

  // 성별은 새 템플릿에 없으므로 값이 있을 때만 별도 줄로 보존
  if (fields.gender?.trim()) {
    lines.splice(3, 0, `성별 : ${fields.gender.trim()}`);
  }

  return lines.join("\n");
}

/**
 * 목록/멘션용 메타를 본문에서 동기화한다.
 * DB 레거시 컬럼에도 맞춰 둔다 (기존 쿼리·카드 호환).
 */
export function syncLegacyFieldsFromContent(content: string): {
  name: string;
  role: string;
  age: string;
  gender: string;
  occupation: string;
  personality: string;
  goal: string;
  secret: string;
  memo: string;
} {
  return {
    name: extractCharacterName(content),
    role: parseCharacterField(content, "별명"),
    age: parseCharacterField(content, "나이"),
    gender: parseCharacterField(content, "성별"),
    occupation: parseCharacterField(content, "직업"),
    personality: parseCharacterField(content, "성격"),
    goal: parseCharacterField(content, "목표"),
    secret: parseCharacterField(content, "비밀"),
    memo: parseCharacterField(content, "메모"),
  };
}
