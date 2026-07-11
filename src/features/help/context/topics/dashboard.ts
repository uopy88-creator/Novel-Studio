import type { ContextHelpContent } from "@/features/help/context/types";

export const dashboardHelp: ContextHelpContent = {
  id: "dashboard",
  title: "Dashboard 사용법",
  description: [
    "Dashboard는 작품 현황을 한눈에 보는 홈 화면입니다.",
    "통계·최근 Chapter·대표 캐릭터·영감 노트를 모아 보여 주며, 이 화면에서는 내용을 수정하지 않습니다.",
  ],
  steps: [
    "상단 통계에서 글자수·원고지·예상 책 페이지를 확인합니다.",
    "최근 Chapter 카드를 누르면 Manuscript로 이동합니다.",
    "대표 캐릭터·영감을 눌러 해당 기능으로 바로 갑니다.",
  ],
  tips: [
    "집필을 시작하려면 사이드바의 Manuscript를 여세요.",
    "통계는 Manuscript 본문을 기준으로 집계됩니다.",
  ],
  faqs: [
    {
      question: "여기서 원고를 수정할 수 있나요?",
      answer: "아니요. Dashboard는 읽기 전용입니다. 수정은 Manuscript에서 하세요.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Chapters", segment: "chapters" },
    { label: "Characters", segment: "characters" },
  ],
};
