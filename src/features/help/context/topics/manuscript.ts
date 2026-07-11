import type { ContextHelpContent } from "@/features/help/context/types";

export const manuscriptHelp: ContextHelpContent = {
  id: "manuscript",
  title: "Manuscript 사용법",
  description: [
    "Manuscript는 프로젝트 전체 원고를 한 화면에서 쓰는 공간입니다.",
    "Chapter는 ================= 구분선으로만 나뉘며, 이어 쓰기에 집중할 수 있습니다.",
  ],
  steps: [
    "에디터에 바로 입력합니다. 원고는 자동 저장됩니다.",
    "Scene Navigator에서 장면을 선택하면 해당 위치로 스크롤됩니다.",
    "「새 장면」으로 장면을 추가합니다. 번호는 자동으로 붙습니다.",
    "장면을 드래그해 순서를 바꿀 수 있습니다.",
    "Version Snapshot으로 특정 시점을 저장·비교·복원할 수 있습니다.",
  ],
  tips: [
    "원고는 자동 저장됩니다. Settings에서 저장 간격을 바꿀 수 있습니다.",
    "Scene은 드래그로 순서를 변경할 수 있습니다.",
    "새 장면 버튼으로 장면을 추가할 수 있습니다.",
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
      answer: "Manuscript 상단의 Export 버튼으로 TXT · DOCX · PDF를 내보낼 수 있습니다.",
    },
  ],
  related: [
    { label: "Chapters", segment: "chapters" },
    { label: "Characters", segment: "characters" },
    { label: "Export", segment: "manuscript" },
  ],
};
