import type { ContextHelpContent } from "@/features/help/context/types";

export const exportHelp: ContextHelpContent = {
  id: "export",
  title: "Export 사용법",
  description: [
    "Export로 원고를 TXT · DOCX · PDF 파일로 내보냅니다.",
    "Manuscript 상단 Export 버튼에서 바로 열 수 있습니다.",
  ],
  steps: [
    "Manuscript에서 Export를 엽니다.",
    "형식(TXT / DOCX / PDF)과 범위(전체·현재 Chapter 등)를 고릅니다.",
    "내보내기를 누르면 파일이 다운로드됩니다.",
  ],
  tips: [
    "기본 형식·범위는 Settings에서 미리 지정할 수 있습니다.",
    "긴 원고는 PDF보다 TXT/DOCX가 편집에 유리할 수 있습니다.",
  ],
  faqs: [
    {
      question: "내보낸 파일이 어디에 있나요?",
      answer: "브라우저 기본 다운로드 폴더에 저장됩니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Settings", segment: "settings" },
  ],
};
