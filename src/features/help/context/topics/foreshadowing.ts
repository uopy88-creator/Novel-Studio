import type { ContextHelpContent } from "@/features/help/context/types";

export const foreshadowingHelp: ContextHelpContent = {
  id: "foreshadowing",
  title: "Foreshadowing 사용법",
  description: [
    "Foreshadowing(복선)은 「심어 둔 것」과 「회수할 것」을 추적하는 도구입니다.",
    "긴 연재에서도 놓치기 쉬운 약속을 목록으로 관리합니다.",
  ],
  steps: [
    "복선 제목과 설명을 추가합니다.",
    "상태를 planned → planted → paid_off 로 바꿉니다.",
    "쓰지 않기로 한 복선은 dropped로 표시합니다.",
    "심은 장·회수할 장을 기록해 두면 Manuscript와 맞춰 보기 쉽습니다.",
  ],
  tips: [
    "회수 전 복선만 모아 보면 「아직 갚지 않은 약속」을 점검할 수 있습니다.",
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
