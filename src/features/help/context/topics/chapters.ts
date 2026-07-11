import type { ContextHelpContent } from "@/features/help/context/types";

export const chaptersHelp: ContextHelpContent = {
  id: "chapters",
  title: "Chapters 사용법",
  description: [
    "Chapter는 원고를 나누는 구분입니다.",
    "Manuscript에서는 모든 Chapter가 순서대로 이어진 하나의 긴 글로 보입니다.",
  ],
  steps: [
    "「새 Chapter」로 제목을 만들어 추가합니다.",
    "왼쪽 ☰ 핸들로 Drag & Drop 해 순서를 바꿉니다.",
    "카드를 클릭하면 Manuscript에서 해당 Chapter로 이동합니다.",
    "수정·삭제는 카드의 버튼을 사용합니다.",
  ],
  tips: [
    "순서를 바꾸면 Manuscript의 Chapter 순서도 함께 바뀝니다.",
    "Chapter는 구분선 역할만 하고, 실제 집필은 Manuscript에서 합니다.",
  ],
  faqs: [
    {
      question: "Chapter를 삭제하면 원고도 사라지나요?",
      answer:
        "해당 Chapter에 연결된 본문이 함께 정리됩니다. 삭제 전 확인 창을 확인하세요.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Dashboard", segment: "dashboard" },
  ],
};
