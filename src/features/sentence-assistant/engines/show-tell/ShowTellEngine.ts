/**
 * =============================================================================
 * ShowTell Engine — Show / Tell 작법 분석
 * -----------------------------------------------------------------------------
 * 역할:
 * - 선택 문장이 Show 인지 Tell 인지 판정한다.
 * - Tell 일 때만 작법 방향(행동·표정·대사·배경)의 독립 예시를 제공한다.
 * - 선택 문장을 수정·재작성하지 않는다. AI 문장 생성 없음.
 *
 * Dictionary · Synonym 과 분리. 네트워크 호출 없음.
 * =============================================================================
 */

import {
  CRAFT_SHOW_EXAMPLES,
  THEME_KEYWORDS,
  type ShowTellThemeId,
} from "@/features/sentence-assistant/engines/show-tell/show-tell-data";
import type {
  ShowTellAnalysis,
  ShowTellExampleResult,
  ShowTellKind,
  ShowTellStyleId,
} from "@/features/sentence-assistant/engines/show-tell/show-tell-types";

/**
 * Tell 신호 — 감정·상태·판단을 「직접 서술」하는 표현.
 * (예: "그는 슬펐다", "기분이 좋았다")
 */
const TELL_PATTERNS: RegExp[] = [
  /슬프[다다고네지]/,
  /슬펐다/,
  /기쁘[다다고네지]/,
  /기뻤다/,
  /화나[다다고네지]/,
  /화가\s*났/,
  /분노하[다다고네]/,
  /우울하[다다고네]/,
  /행복하[다다고네]/,
  /무섭[다다고네]/,
  /무섭다/,
  /두려웠/,
  /두렵[다다고네]/,
  /외롭[다다고네]/,
  /외로웠/,
  /걱정[이했하]/,
  /불안하[다다고네]/,
  /피곤하[다다고네]/,
  /좋아하[다다고네]/,
  /싫어하[다다고네]/,
  /사랑하[다다고네]/,
  /실망하[다다고네]/,
  /후회하[다다고네]/,
  /부럽[다다고네]/,
  /창피하[다다고네]/,
  /부끄러[웠웠다운]/,
  /괴로웠/,
  /힘들었다/,
  /긴장하[다다고네]/,
  /설렜/,
  /설레었/,
  /짜증[이나]/,
  /억울하[다다고네]/,
  /허무하[다다고네]/,
  /절망하[다다고네]/,
  /느[꼈낀]/,
  /생각했다/,
  /알고\s*있/,
  /알고\s*있었/,
  /마음(?:이|은)?\s*(?:아팠|무거웠|편했|복잡|놓였)/,
  /기분이\s*(?:좋|나쁘|우울|최악|상쾌)/,
  /분위기(?:가|는)?\s*(?:무거웠|어두웠|험악|슬픈|좋았)/,
  /감정(?:이|을)?\s*(?:복잡|격해|북받)/,
  /(?:너무|아주|정말)\s*(?:슬프|기쁘|화나|무섭|외롭|행복|피곤)/,
];

/**
 * Show 신호 — 감각·행동·대사·구체 묘사로 「보여 주는」 표현.
 * (예: "주먹을 쥐었다", "“괜찮아.”")
 */
const SHOW_PATTERNS: RegExp[] = [
  /[“”「」『』"'‘’]/,
  /바라보/,
  /쳐다보/,
  /훑어보/,
  /응시/,
  /악물/,
  /주먹을?.{0,8}쥐/,
  /손을?.{0,8}(?:떨|잡|놓|뻗|움켜)/,
  /눈이?.{0,8}(?:커|붉|젖|흔들|마주|반짝)/,
  /시선/,
  /마주치/,
  /귀가?.{0,6}붉/,
  /입술/,
  /어깨/,
  /턱이?.{0,6}(?:굳|떨|괴)/,
  /미간/,
  /떨렸/,
  /떨리/,
  /초침/,
  /햇살/,
  /바람/,
  /냄새/,
  /발소리/,
  /물러서/,
  /걸어가/,
  /문을?.{0,6}(?:열|닫|두드)/,
  /창(?:문|가)/,
  /커튼/,
  /그림자/,
  /소리가?.{0,6}(?:들|울|났)/,
  /한숨을?.{0,8}쉬/,
  /고개를?.{0,8}(?:숙|돌|젓|끄덕)/,
  /주머니/,
  /콧노래/,
  /난간/,
  /가로등/,
  /형광등/,
  /식탁/,
  /커피/,
  /컵을?\s*(?:들|놓|내려)/,
  /발걸음/,
  /숨을?\s*(?:고르|죽|참)/,
  /이를?\s*악/,
];

function normalizeSentence(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function detectTheme(sentence: string): ShowTellThemeId {
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS) as [
    Exclude<ShowTellThemeId, "generic">,
    string[],
  ][]) {
    if (keywords.some((kw) => sentence.includes(kw))) {
      return theme;
    }
  }
  return "generic";
}

function scorePatterns(sentence: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (score, pattern) => (pattern.test(sentence) ? score + 1 : score),
    0,
  );
}

function hasSensoryAnchor(sentence: string): boolean {
  return /(?:빛|소리|향|바람|손|눈|발|문|창|방|거리|공기|그림자|컵|커튼)/.test(
    sentence,
  );
}

export class ShowTellEngine {
  /**
   * 선택 문장이 Show 인지 Tell 인지 판정한다.
   * 완벽한 문학 분석이 아니라, 작가가 참고할 방향 신호다.
   */
  analyze(raw: string): ShowTellAnalysis | null {
    const sentence = normalizeSentence(raw);
    if (!sentence) return null;

    const tellScore = scorePatterns(sentence, TELL_PATTERNS);
    const showScore = scorePatterns(sentence, SHOW_PATTERNS);

    // 짧은 감정 직설문은 Tell 쪽으로 기울인다.
    const shortTellBoost =
      sentence.length <= 32 && tellScore > 0 ? 1 : 0;

    // Show 신호가 분명하게 우세하면 Show
    if (showScore > tellScore + shortTellBoost) {
      return { sentence, kind: "show" };
    }

    // Tell 신호가 있으면 Tell (동점이면 Tell — 직접 서술을 먼저 짚어 줌)
    if (tellScore > 0) {
      return { sentence, kind: "tell" };
    }

    // 둘 다 약하면: 감각·구체 묘사면 Show, 아니면 Tell
    if (showScore > 0 || hasSensoryAnchor(sentence)) {
      return { sentence, kind: "show" };
    }

    return { sentence, kind: "tell" };
  }

  /**
   * Tell → Show 작법 방향의 독립 예시를 여러 개 반환한다.
   * sentence 는 테마 추정에만 쓰고, 예시는 선택 문장을 고치지 않는다.
   */
  getCraftExamples(
    sentence: string,
    style: ShowTellStyleId,
  ): ShowTellExampleResult {
    const theme = detectTheme(normalizeSentence(sentence));
    const bank = CRAFT_SHOW_EXAMPLES[theme] ?? CRAFT_SHOW_EXAMPLES.generic;
    const examples = [...(bank[style] ?? CRAFT_SHOW_EXAMPLES.generic[style])];

    return { style, examples };
  }

  /**
   * @deprecated Core / 하위 호환 — getCraftExamples 로 위임
   * targetKind 는 무시한다 (Tell 전용 작법 예시만 제공).
   */
  getReferenceExample(
    sentence: string,
    _targetKind: ShowTellKind,
    style: ShowTellStyleId,
  ): ShowTellExampleResult {
    return this.getCraftExamples(sentence, style);
  }

  detectTheme(sentence: string): ShowTellThemeId {
    return detectTheme(normalizeSentence(sentence));
  }
}

export const showTellEngine = new ShowTellEngine();

/**
 * =============================================================================
 * 자가 검증용 코퍼스 (개발자 전용)
 * -----------------------------------------------------------------------------
 * Tell 20+ / Show 20+ 문장으로 판정 정확도를 확인한다.
 * =============================================================================
 */
export const SHOW_TELL_TEST_TELL: string[] = [
  "그는 슬펐다.",
  "그녀는 기뻤다.",
  "나는 화가 났다.",
  "마음이 아팠다.",
  "기분이 우울했다.",
  "그는 외로웠다.",
  "그녀는 두려웠다.",
  "나는 행복했다.",
  "너무 피곤했다.",
  "그는 실망했다.",
  "그녀는 후회했다.",
  "나는 부끄러웠다.",
  "분위기가 무거웠다.",
  "그는 그녀를 사랑했다.",
  "나는 그를 좋아했다.",
  "그녀는 불안했다.",
  "정말 무서웠다.",
  "그는 긴장했다.",
  "나는 억울했다.",
  "그녀는 허무했다.",
  "그는 절망했다.",
  "기분이 최악이었다.",
  "마음이 복잡했다.",
  "나는 그를 부러워했다.",
];

export const SHOW_TELL_TEST_SHOW: string[] = [
  "그는 한동안 말없이 창문만 바라보고 있었다.",
  "컵을 내려놓자 손끝이 살짝 떨렸다.",
  "입술이 가늘게 떨렸다.",
  "“괜찮아.” 그는 그렇게 말했지만 목소리는 떨리고 있었다.",
  "방 안에는 시계 초침 소리만 들렸다.",
  "주먹을 꽉 쥐고 한참을 서 있었다.",
  "턱이 굳게 다물어졌다.",
  "문이 세게 닫히며 벽이 한순간 울렸다.",
  "발소리를 죽인 채 천천히 뒤로 물러섰다.",
  "형광등이 한 번 깜빡이고 다시 켜졌다.",
  "주머니에 손을 넣은 채 콧노래를 흥얼거렸다.",
  "창으로 들어온 햇살이 책상 위를 환하게 비췄다.",
  "고개를 살짝 끄덕였다.",
  "시선이 마주치자 귀가 살짝 붉어졌다.",
  "가로등 아래 그림자가 나란히 겹쳤다.",
  "한숨을 길게 쉬었다.",
  "커튼 사이로 들어온 빛이 바닥에서 길게 식어 있었다.",
  "식탁 위 커피는 이미 식어 있었다.",
  "난간을 붙잡은 손바닥이 축축했다.",
  "미간이 깊게 접히며 시선이 가라앉았다.",
  "그는 창가에 기대선 채 움직이지 않았다.",
  "바람이 커튼을 살짝 밀어 올렸다.",
];

export interface ShowTellSelfTestResult {
  tellTotal: number;
  tellPassed: number;
  showTotal: number;
  showPassed: number;
  failures: Array<{ sentence: string; expected: ShowTellKind; got: ShowTellKind | null }>;
}

/** Tell/Show 코퍼스 자가 검증. 실패 목록을 반환한다. */
export function runShowTellSelfTest(
  engine: ShowTellEngine = showTellEngine,
): ShowTellSelfTestResult {
  const failures: ShowTellSelfTestResult["failures"] = [];

  for (const sentence of SHOW_TELL_TEST_TELL) {
    const got = engine.analyze(sentence)?.kind ?? null;
    if (got !== "tell") {
      failures.push({ sentence, expected: "tell", got });
    }
  }

  for (const sentence of SHOW_TELL_TEST_SHOW) {
    const got = engine.analyze(sentence)?.kind ?? null;
    if (got !== "show") {
      failures.push({ sentence, expected: "show", got });
    }
  }

  return {
    tellTotal: SHOW_TELL_TEST_TELL.length,
    tellPassed:
      SHOW_TELL_TEST_TELL.length -
      failures.filter((f) => f.expected === "tell").length,
    showTotal: SHOW_TELL_TEST_SHOW.length,
    showPassed:
      SHOW_TELL_TEST_SHOW.length -
      failures.filter((f) => f.expected === "show").length,
    failures,
  };
}
