import type { ContextHelpContent } from "@/features/help/context/types";

export const manuscriptHelp: ContextHelpContent = {
  id: "manuscript",
  title: "Manuscript 사용법",
  description: [
    "Manuscript는 프로젝트 전체 원고를 한 화면에서 쓰는 공간입니다.",
    "구간 추가·순서·상태·아이콘은 Section 페이지에서 관리하고, 여기서는 집필에 집중합니다.",
  ],
  steps: [
    "에디터에 바로 입력합니다. 원고는 자동 저장됩니다.",
    "Section 페이지에서 구간을 선택하면 Manuscript의 해당 위치로 이동합니다.",
    "Version Snapshot으로 특정 시점을 저장·비교·복원할 수 있습니다.",
  ],
  tips: [
    "원고는 자동 저장됩니다. Settings에서 저장 간격을 바꿀 수 있습니다.",
    "Section 구조는 사이드바의 Section 메뉴에서 관리합니다.",
    "Version Snapshot으로 특정 시점을 저장할 수 있습니다.",
    "예기치 않게 닫혀도 Auto Recovery 초안으로 복구할 수 있습니다.",
    "원고에서 @ 를 입력하면 캐릭터를 멘션할 수 있습니다.",
  ],
  faqs: [
    {
      question: "인터넷이 끊기면?",
      answer: "Auto Recovery가 브라우저에 초안을 남깁니다. 다시 접속하면 복구 안내가 뜹니다.",
    },
    {
      question: "Export는 어디서 하나요?",
      answer: "Manuscript 상단의 Export 버튼으로 TXT · DOCX · PDF로보낼 수 있습니다.",
    },
    {
      question: "Section은 어디서 나누나요?",
      answer: "사이드바의 Section 페이지에서 추가·순서 변경·상태·아이콘을 관리합니다.",
    },
  ],
  related: [
    { label: "Section", segment: "sections" },
    { label: "Characters", segment: "characters" },
    { label: "Timeline", segment: "timeline" },
    { label: "Export", segment: "manuscript" },
  ],
};
