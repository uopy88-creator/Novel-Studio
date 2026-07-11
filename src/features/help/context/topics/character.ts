import type { ContextHelpContent } from "@/features/help/context/types";

export const characterHelp: ContextHelpContent = {
  id: "character",
  title: "Characters 사용법",
  description: [
    "Characters는 등장인물을 자유롭게 정리하는 공간입니다.",
    "이름 · 나이 · 직업 · 성격 · 목표 · 비밀 등을 적어 두고 집필 중 참고합니다.",
  ],
  steps: [
    "「+ 캐릭터 추가」로 프로필을 만듭니다.",
    "이름과 역할·성격·목표·비밀 등을 채웁니다.",
    "카드를 눌러 언제든 수정합니다.",
    "즐겨찾기로 자주 보는 인물을 위에 고정할 수 있습니다.",
  ],
  tips: [
    "원고에서 @이름 을 입력하면 Character와 자동 연결됩니다.",
    "캐릭터 이름을 바꾸면 원고 속 멘션도 맞춰집니다.",
  ],
  faqs: [
    {
      question: "@멘션이 안 열려요.",
      answer: "Manuscript 에디터 안에서 @ 를 입력해 보세요. 등록된 캐릭터가 있어야 목록이 나타납니다.",
    },
  ],
  related: [
    { label: "Manuscript", segment: "manuscript" },
    { label: "Writing Vault", segment: "writing-vault" },
  ],
};
