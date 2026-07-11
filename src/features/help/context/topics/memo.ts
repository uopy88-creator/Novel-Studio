import type { ContextHelpContent } from "@/features/help/context/types";

export const memoHelp: ContextHelpContent = {
  id: "memo",
  title: "Memo 사용법",
  description: [
    "Memo는 짧은 생각·할 일·질문을 가볍게 남기는 공간입니다.",
    "Chapter나 Character에 붙이지 않아도, 일단 적어 둘 수 있습니다.",
  ],
  steps: [
    "새 메모를 만들고 본문을 적습니다.",
    "아이디어 · 할 일 · 질문 · 일반 노트 중 성격에 맞게 분류합니다.",
    "중요한 메모는 고정해 목록 상단에 둡니다.",
  ],
  tips: [
    "집필 흐름을 끊지 않고 메모만 빠르게 쌓아 두세요.",
    "나중에 Chapters나 Characters와 연결해 정리할 수 있습니다.",
  ],
  faqs: [
    {
      question: "Memo가 「준비 중」으로 보여요.",
      answer:
        "화면 골격은 연결되어 있으며, 자세한 사용법은 Help Center의 Memo 절에서도 확인할 수 있습니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Foreshadowing", segment: "foreshadowing" },
  ],
};
