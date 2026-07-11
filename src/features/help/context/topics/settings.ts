import type { ContextHelpContent } from "@/features/help/context/types";

export const settingsHelp: ContextHelpContent = {
  id: "settings",
  title: "Settings 사용법",
  description: [
    "Settings에서 에디터·테마·자동 저장·Export 기본값·백업·계정을 관리합니다.",
    "설정은 이 브라우저(계정)에 저장되어 Manuscript 등 화면에 바로 반영됩니다.",
  ],
  steps: [
    "글꼴 크기·에디터 폭·자동 저장 간격을 고릅니다.",
    "다크 모드(테마)를 바꿉니다.",
    "Export 기본 형식·범위를 지정합니다.",
    "백업 파일을 내보내거나 가져와 데이터를 옮깁니다.",
    "로그아웃은 계정 섹션에서 합니다.",
  ],
  tips: [
    "단축키 목록도 Settings에서 확인할 수 있습니다.",
    "백업 복원은 현재 로컬 백업을 덮어쓰므로 주의하세요.",
  ],
  faqs: [
    {
      question: "자동 저장 간격은 어디에 쓰이나요?",
      answer: "Manuscript 자동 저장 타이머에 적용됩니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Help Center", href: "/help" },
  ],
};
