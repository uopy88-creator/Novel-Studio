import type { ContextHelpContent } from "@/features/help/context/types";

/** Section 페이지 — 원고 구간 구조 관리 */
export const sectionsHelp: ContextHelpContent = {
  id: "sections",
  title: "Section 사용법",
  description: [
    "Section은 Manuscript 안의 구간입니다. 별도 문서가 아닙니다.",
    "여기서 추가·이름·순서·상태·아이콘·메모를 관리하고, 항목을 누르면 Manuscript로 이동합니다.",
  ],
  steps: [
    "「＋ 새 Section」으로 구간을 추가합니다. 번호는 자동으로 붙습니다.",
    "드래그로 순서를 바꿉니다. 원고 본문 순서도 함께 맞춰집니다.",
    "상태(초안/수정중/완료)와 아이콘(★중요 · 📌복선 · 💬대사)을 표시합니다.",
    "구간을 선택하면 Manuscript의 해당 위치로 스크롤됩니다.",
  ],
  tips: [
    "집필은 Manuscript, 구조 관리는 Section — 역할이 나뉘어 있습니다.",
    "메모는 작가 전용이며 Export 본문에 기본적으로 포함되지 않습니다.",
  ],
  faqs: [
    {
      question: "번호를 직접 고칠 수 있나요?",
      answer: "아니요. 순서를 바꾸면 번호가 자동으로 다시 매겨집니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Timeline", segment: "timeline" },
    { label: "Foreshadowing", segment: "foreshadowing" },
  ],
};
