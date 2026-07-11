import type { ContextHelpContent } from "@/features/help/context/types";

export const vaultHelp: ContextHelpContent = {
  id: "vault",
  title: "Writing Vault 사용법",
  description: [
    "Writing Vault는 문장·단어·아이디어를 원고와 따로 모아 두는 금고입니다.",
    "Sentence · Word · Idea 종류로 나누고, 태그·Reference·즐겨찾기로 정리합니다.",
  ],
  steps: [
    "「항목 추가」로 Sentence / Word / Idea 중 하나를 고릅니다.",
    "본문과 태그를 입력하고, 필요하면 Reference(작품·작가)를 적습니다.",
    "종류 필터·검색으로 원하는 항목을 찾습니다.",
    "즐겨찾기로 자주 쓰는 항목을 고정합니다.",
  ],
  tips: [
    "Sentence: 마음에 드는 문장·대사 조각",
    "Word: 표현·어휘",
    "Idea: 아직 원고에 넣지 않은 아이디어",
    "Reference로 출처를 남겨 두면 나중에 찾기 쉽습니다.",
  ],
  faqs: [
    {
      question: "원고와 자동으로 연결되나요?",
      answer:
        "Vault는 원고와 독립입니다. 필요할 때 참고하거나 복사해 쓰면 됩니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Characters", segment: "characters" },
    { label: "Inspiration", segment: "inspiration" },
  ],
};
