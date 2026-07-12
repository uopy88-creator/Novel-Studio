import type { ContextHelpContent } from "@/features/help/context/types";

export const foreshadowingHelp: ContextHelpContent = {
  id: "foreshadowing",
  title: "Foreshadowing 사용법",
  description: [
    "Foreshadowing(복선)은 「심어 둔 것」과 「회수할 것」을 추적하는 도구입니다.",
    "AI가 만들지 않습니다. 작가가 직접 기록하고 관리합니다.",
  ],
  steps: [
    "「+ 새 복선」으로 제목과 설명을 추가합니다.",
    "상태를 심음 → 회수 예정 → 회수 완료로 바꿉니다.",
    "필터·검색으로 아직 회수하지 않은 복선만 모아 볼 수 있습니다.",
  ],
  tips: [
    "회수 예정만 모아 보면 「아직 갚지 않은 약속」을 점검할 수 있습니다.",
  ],
  faqs: [
    {
      question: "원고에 자동으로 들어가나요?",
      answer: "아니요. 추적 도구입니다. 실제 문장은 Manuscript에서 작성합니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Memo", segment: "memo" },
    { label: "Timeline", segment: "timeline" },
  ],
};
