/**
 * =============================================================================
 * Show / Tell 참고 예시 데이터
 * -----------------------------------------------------------------------------
 * ShowTell Engine 전용. 데이터 추가·교체 시 이 파일만 수정하면 된다.
 * =============================================================================
 */

import type { ShowTellStyleId } from "@/features/sentence-assistant/engines/show-tell/show-tell-types";

export type ShowTellThemeId =
  | "sadness"
  | "joy"
  | "anger"
  | "fear"
  | "love"
  | "generic";

export type ShowTellExampleSet = Record<ShowTellStyleId, string>;

export const TO_SHOW_EXAMPLES: Record<ShowTellThemeId, ShowTellExampleSet> = {
  sadness: {
    action: "그는 한동안 말없이 창문만 바라보고 있었다.",
    expression: "입술이 가늘게 떨렸다.",
    dialogue: "“…괜찮아.”\n그는 그렇게 말했지만 목소리는 떨리고 있었다.",
    setting: "방 안에는 시계 초침 소리만 들렸다.",
  },
  joy: {
    action: "그는 발걸음을 가볍게 하며 복도를 건너갔다.",
    expression: "입가가 저도 모르게 올라갔다.",
    dialogue: "“정말이야?”\n목소리가 높았다.",
    setting: "창으로 들어온 햇살이 책상 위를 환하게 비췄다.",
  },
  anger: {
    action: "그는 주먹을 꽉 쥐고 한참을 서 있었다.",
    expression: "턱이 굳게 다물어졌다.",
    dialogue: "“됐어요.”\n짧게 끊긴 말뿐이었다.",
    setting: "문이 세게 닫히며 벽이 한순간 울렸다.",
  },
  fear: {
    action: "그는 발소리를 죽인 채 천천히 뒤로 물러섰다.",
    expression: "어깨가 미세하게 움츠러들었다.",
    dialogue: "“…누가 있어?”\n속삭이듯 물었다.",
    setting: "복도 끝 그림자가 길게 늘어져 있었다.",
  },
  love: {
    action: "그는 손을 뻗었다가, 다시 거둬들였다.",
    expression: "눈이 잠시 그녀의 얼굴에 머물러 있었다.",
    dialogue: "“괜찮으면… 조금 더 있어도 돼.”",
    setting: "늦은 오후 공기가 부드럽게 감돌았다.",
  },
  generic: {
    action: "그는 한동안 말없이 그 자리를 지키고 있었다.",
    expression: "표정이 잠깐 굳었다가 풀렸다.",
    dialogue: "“…알겠어.”\n짧게 대답했다.",
    setting: "주변이 잠시 고요해졌다.",
  },
};

export const TO_TELL_EXAMPLES: Record<ShowTellThemeId, ShowTellExampleSet> = {
  sadness: {
    action: "그는 슬퍼서 움직일 수 없었다.",
    expression: "그는 슬픈 표정을 지었다.",
    dialogue: "그는 괜찮다고 말했지만, 사실은 슬펐다.",
    setting: "그 방은 슬픈 분위기였다.",
  },
  joy: {
    action: "그는 기쁜 마음으로 걸었다.",
    expression: "그는 기쁜 표정이었다.",
    dialogue: "그는 기쁜 목소리로 말했다.",
    setting: "주변이 기쁘게 느껴졌다.",
  },
  anger: {
    action: "그는 화가 나서 서 있었다.",
    expression: "그는 화난 표정이었다.",
    dialogue: "그는 화가 난 채로 말했다.",
    setting: "그 순간 분위기는 험악했다.",
  },
  fear: {
    action: "그는 두려워서 물러섰다.",
    expression: "그는 겁에 질린 표정이었다.",
    dialogue: "그는 무서워서 물었다.",
    setting: "그곳은 두려운 분위기였다.",
  },
  love: {
    action: "그는 사랑해서 손을 뻗었다.",
    expression: "그는 다정한 눈빛이었다.",
    dialogue: "그는 사랑스럽게 말했다.",
    setting: "그 공기는 다정하게 느껴졌다.",
  },
  generic: {
    action: "그는 아무 말도 하지 못했다.",
    expression: "그는 복잡한 표정이었다.",
    dialogue: "그는 짧게 대답했다.",
    setting: "분위기가 무거웠다.",
  },
};

export const THEME_KEYWORDS: Record<
  Exclude<ShowTellThemeId, "generic">,
  string[]
> = {
  sadness: [
    "슬프",
    "슬펐",
    "서글프",
    "우울",
    "침울",
    "눈물",
    "허탈",
    "비통",
    "처량",
    "애달프",
    "쓸쓸",
    "외로",
    "외롭",
  ],
  joy: [
    "기쁘",
    "기뻤",
    "즐겁",
    "행복",
    "유쾌",
    "흥겹",
    "반갑",
    "흐뭇",
    "신나",
    "즐거",
  ],
  anger: [
    "화나",
    "화났",
    "분노",
    "성나",
    "성났",
    "격분",
    "분개",
    "언짢",
    "짜증",
    "열받",
    "분이 ",
  ],
  fear: [
    "무섭",
    "무서웠",
    "두렵",
    "두려웠",
    "겁나",
    "겁났",
    "소름",
    "섬뜩",
    "오싹",
    "공포",
    "불안",
  ],
  love: ["사랑", "애정", "연정", "사모", "다정", "좋아하", "그리워"],
};
