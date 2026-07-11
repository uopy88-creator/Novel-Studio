import type { ContextHelpContent } from "@/features/help/context/types";

export const projectHelp: ContextHelpContent = {
  id: "project",
  title: "Projects 사용법",
  description: [
    "Projects는 작품을 만들고 골라 들어가는 첫 화면입니다.",
    "작품마다 Chapters · Manuscript · Characters 등 데이터가 따로 관리됩니다.",
  ],
  steps: [
    "「새 작품」으로 제목을 입력해 작품을 만듭니다.",
    "카드 전체를 클릭하면 해당 작품 작업실(Dashboard)로 들어갑니다.",
    "✏️ 로 제목을 수정하고, 🗑 로 삭제합니다. 삭제 전 확인 창이 뜹니다.",
  ],
  tips: [
    "삭제하면 Chapters·Manuscript·Characters 등 연결된 데이터가 모두 지워지며 복구할 수 없습니다.",
    "같은 계정으로 로그인하면 다른 기기에서도 작품 목록이 동기화됩니다.",
  ],
  faqs: [
    {
      question: "작품 설명은 어디서 바꾸나요?",
      answer:
        "새 작품 만들 때 설명을 넣을 수 있습니다. 수정 모달에서는 제목을 바꿉니다.",
    },
  ],
  related: [
    { label: "Help Center", href: "/help" },
  ],
};
