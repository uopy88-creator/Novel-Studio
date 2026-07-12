/**
 * =============================================================================
 * Help Center — 문서 데이터
 * -----------------------------------------------------------------------------
 * 새 기능 추가 시 이 파일만 수정하면 Help 페이지·목차·검색이 자동 반영된다.
 * =============================================================================
 */

import type { HelpDocument } from "@/features/help/types/help";

export const HELP_DOCUMENT: HelpDocument = {
  title: "Novel Studio",
  subtitle:
    "처음 사용하는 분도 5분 안에 시작할 수 있도록 정리한 도움말입니다.",
  sections: [
    {
      id: "intro",
      title: "소개",
      blocks: [
        {
          type: "paragraph",
          text: "Novel Studio는 소설 집필에 집중한 작업실입니다. 작품(Project) 안에서 Manuscript · Characters · Writing Vault 등을 한곳에서 이어 씁니다.",
        },
        {
          type: "paragraph",
          text: "데이터는 클라우드에 저장되어 같은 계정으로 여러 기기에서 이어 쓸 수 있습니다.",
        },
      ],
    },
    {
      id: "getting-started",
      title: "1. 시작하기",
      children: [
        {
          id: "getting-started-signup",
          title: "회원가입",
          blocks: [
            {
              type: "paragraph",
              text: "시작 화면에서 「회원가입」을 선택한 뒤 이메일과 비밀번호(6자 이상)를 입력합니다.",
            },
            {
              type: "list",
              items: [
                "이메일로 계정을 만듭니다.",
                "가입 후 바로 로그인되어 작품 목록으로 이동합니다.",
              ],
            },
          ],
        },
        {
          id: "getting-started-login",
          title: "로그인",
          blocks: [
            {
              type: "paragraph",
              text: "이미 계정이 있다면 「로그인」에서 이메일·비밀번호로 작업실에 들어갑니다.",
            },
          ],
        },
        {
          id: "getting-started-create-project",
          title: "작품 만들기",
          blocks: [
            {
              type: "paragraph",
              text: "작품 목록에서 「새 작품」을 누르고 제목(필수)과 설명(선택)을 입력합니다.",
            },
            {
              type: "list",
              items: [
                "만든 작품을 클릭하면 Dashboard 등 작업실로 들어갑니다.",
                "사이드바에서 Manuscript · Characters 등 기능으로 이동합니다.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "project",
      title: "2. Project",
      children: [
        {
          id: "project-create",
          title: "작품 생성",
          blocks: [
            {
              type: "paragraph",
              text: "작품 목록의 「새 작품」으로 프로젝트를 추가합니다. 제목만 있어도 바로 시작할 수 있습니다.",
            },
          ],
        },
        {
          id: "project-edit",
          title: "작품 수정",
          blocks: [
            {
              type: "paragraph",
              text: "작품 카드 오른쪽 위의 ✏️ 버튼을 누르면 제목을 수정할 수 있습니다. 저장하면 목록이 바로 갱신됩니다.",
            },
          ],
        },
        {
          id: "project-delete",
          title: "작품 삭제",
          blocks: [
            {
              type: "paragraph",
              text: "🗑 버튼을 누르면 확인 창이 열립니다. 삭제하면 Manuscript · Sections · Characters · Writing Vault · Memo · Foreshadowing 등 연결된 데이터가 함께 삭제되며 복구할 수 없습니다.",
            },
          ],
        },
      ],
    },
    {
      id: "manuscript-sections",
      title: "3. Manuscript · Sections",
      children: [
        {
          id: "sections-navigator",
          title: "Section Navigator",
          blocks: [
            {
              type: "paragraph",
              text: "사이드바의 Section 페이지에서 원고 구간을 보고, 상태를 바꾸거나 접을 수 있습니다. 구간을 선택하면 Manuscript의 해당 위치로 이동합니다.",
            },
          ],
        },
        {
          id: "sections-add",
          title: "새 Section",
          blocks: [
            {
              type: "paragraph",
              text: "Section 페이지에서 새 Section을 추가하면 마커가 자동으로 붙습니다. 번호는 프로그램이 관리하므로 직접 입력할 필요가 없습니다.",
            },
          ],
        },
        {
          id: "sections-reorder",
          title: "순서 변경",
          blocks: [
            {
              type: "paragraph",
              text: "Section을 드래그로 순서를 바꿀 수 있습니다. 순서를 바꾸면 원고 내용 순서도 함께 맞춰집니다.",
            },
          ],
        },
        {
          id: "sections-icons",
          title: "아이콘",
          blocks: [
            {
              type: "paragraph",
              text: "★ 중요 · 📌 복선 · 💬 대사 아이콘으로 구간을 표시할 수 있습니다.",
            },
          ],
        },
      ],
    },
    {
      id: "manuscript",
      title: "4. Manuscript",
      children: [
        {
          id: "manuscript-writing",
          title: "전체 원고 작성",
          blocks: [
            {
              type: "paragraph",
              text: "Manuscript는 프로젝트 전체 원고를 한 화면에서 보여 줍니다. 구간 구조는 Section 페이지에서 관리하고, 여기서는 이어 쓰기에 집중할 수 있습니다.",
            },
          ],
        },
        {
          id: "manuscript-autosave",
          title: "자동 저장",
          blocks: [
            {
              type: "paragraph",
              text: "입력하면 자동으로 저장됩니다. 저장 간격은 Settings에서 바꿀 수 있습니다. 화면의 저장 상태 표시로 확인하세요.",
            },
          ],
        },
        {
          id: "manuscript-scenes",
          title: "Section 관리",
          blocks: [
            {
              type: "paragraph",
              text: "구간 추가·순서·상태·아이콘은 사이드바의 Section 페이지에서 관리합니다. 구간을 선택하면 Manuscript의 해당 위치로 스크롤됩니다.",
            },
          ],
        },
        {
          id: "manuscript-new-scene",
          title: "새 Section",
          blocks: [
            {
              type: "paragraph",
              text: "Section 페이지에서 새 Section을 추가하면 마커가 자동으로 붙습니다. 번호는 프로그램이 관리하므로 직접 입력할 필요가 없습니다.",
            },
          ],
        },
        {
          id: "manuscript-dnd",
          title: "Drag & Drop",
          blocks: [
            {
              type: "paragraph",
              text: "Section 페이지에서 구간을 드래그로 순서를 바꿀 수 있습니다. 순서를 바꾸면 원고 내용 순서도 함께 맞춰집니다.",
            },
          ],
        },
        {
          id: "manuscript-versions",
          title: "버전 저장",
          blocks: [
            {
              type: "paragraph",
              text: "명시적으로 버전(스냅샷)을 저장해 두면 나중에 비교·복원할 수 있습니다. 자동 저장과는 별개의 안전망입니다.",
            },
          ],
        },
        {
          id: "manuscript-recovery",
          title: "자동 복구",
          blocks: [
            {
              type: "paragraph",
              text: "브라우저에 Auto Recovery 초안이 남습니다. 예기치 않게 닫히거나 연결이 끊겨도 복구 안내를 통해 이어서 쓸 수 있습니다.",
            },
          ],
        },
      ],
    },
    {
      id: "characters",
      title: "5. Characters",
      children: [
        {
          id: "characters-write",
          title: "Character 작성",
          blocks: [
            {
              type: "paragraph",
              text: "Characters에서 인물 프로필을 추가합니다. 역할·성격·목표·비밀 등을 적어 두고 집필 중 참고합니다.",
            },
          ],
        },
        {
          id: "characters-mention",
          title: "@Mention 사용",
          blocks: [
            {
              type: "paragraph",
              text: "원고에서 @ 를 입력하면 캐릭터 목록이 열립니다. 선택하면 멘션이 삽입되어 인물과 원고를 빠르게 연결할 수 있습니다.",
            },
          ],
        },
        {
          id: "characters-sync",
          title: "자동 동기화",
          blocks: [
            {
              type: "paragraph",
              text: "캐릭터 이름을 바꾸면 원고 속 멘션도 함께 맞춰집니다. 여러 기기에서도 같은 계정으로 동기화됩니다.",
            },
          ],
        },
      ],
    },
    {
      id: "writing-vault",
      title: "6. Writing Vault",
      children: [
        {
          id: "writing-vault-sentence",
          title: "Sentence",
          blocks: [
            {
              type: "paragraph",
              text: "마음에 드는 문장·대사 조각을 Sentence로 모아 둡니다. 원고와는 독립된 보관함입니다.",
            },
          ],
        },
        {
          id: "writing-vault-word",
          title: "Word",
          blocks: [
            {
              type: "paragraph",
              text: "표현·어휘를 Word 항목으로 저장해 두고 필요할 때 꺼내 씁니다.",
            },
          ],
        },
        {
          id: "writing-vault-idea",
          title: "Idea",
          blocks: [
            {
              type: "paragraph",
              text: "아직 원고에 넣지 않은 아이디어를 Idea로 적어 둡니다.",
            },
          ],
        },
        {
          id: "writing-vault-tags",
          title: "태그",
          blocks: [
            {
              type: "paragraph",
              text: "태그로 항목을 분류하고 검색할 수 있습니다.",
            },
          ],
        },
        {
          id: "writing-vault-reference",
          title: "Reference",
          blocks: [
            {
              type: "paragraph",
              text: "작품 제목·작가 등 참고 출처를 Reference로 남겨 두면 나중에 출처를 찾기 쉽습니다.",
            },
          ],
        },
        {
          id: "writing-vault-favorite",
          title: "즐겨찾기",
          blocks: [
            {
              type: "paragraph",
              text: "자주 쓰는 항목은 즐겨찾기로 고정해 목록 상단에서 바로 엽니다.",
            },
          ],
        },
      ],
    },
    {
      id: "memo",
      title: "7. Memo",
      blocks: [
        {
          type: "paragraph",
          text: "Memo는 짧은 생각·할 일·질문을 가볍게 남기는 공간입니다. Section이나 Character에 붙이지 않아도 일단 적어 둘 수 있습니다.",
        },
        {
          type: "list",
          items: [
            "아이디어 · 할 일 · 질문 · 일반 노트로 분류할 수 있습니다.",
            "집필 흐름을 끊지 않고 메모만 빠르게 쌓아 두세요.",
          ],
        },
      ],
    },
    {
      id: "foreshadowing",
      title: "8. Foreshadowing",
      blocks: [
        {
          type: "paragraph",
          text: "Foreshadowing(복선)으로 「심어 둔 것」과 「회수할 것」을 추적합니다.",
        },
        {
          type: "list",
          items: [
            "심음 → 회수 예정 → 회수 완료 상태로 관리합니다.",
            "제목·설명으로 검색하고, 상태별로 필터할 수 있습니다.",
            "작가가 직접 기록합니다. AI가 생성하거나 분석하지 않습니다.",
          ],
        },
      ],
    },
    {
      id: "export",
      title: "9. Export",
      children: [
        {
          id: "export-txt",
          title: "TXT",
          blocks: [
            {
              type: "paragraph",
              text: "원고를 일반 텍스트(.txt)로 내보냅니다. 다른 에디터로 옮길 때 유용합니다.",
            },
          ],
        },
        {
          id: "export-docx",
          title: "DOCX",
          blocks: [
            {
              type: "paragraph",
              text: "Word에서 열 수 있는 .docx로 내보냅니다.",
            },
          ],
        },
        {
          id: "export-pdf",
          title: "PDF",
          blocks: [
            {
              type: "paragraph",
              text: "읽기·공유용 PDF로 내보냅니다. Export 기본값은 Settings에서 바꿀 수 있습니다.",
            },
          ],
        },
      ],
    },
    {
      id: "cloud-sync",
      title: "10. Cloud Sync",
      blocks: [
        {
          type: "paragraph",
          text: "같은 계정으로 로그인하면 PC·노트북·태블릿에서 이어서 작성할 수 있습니다.",
        },
        {
          type: "list",
          items: [
            "작품 데이터는 클라우드에 저장됩니다.",
            "로컬에는 백업 스냅샷이 남아 복원에도 쓸 수 있습니다.",
            "설정에서 백업 파일을보내거나 가져올 수 있습니다.",
          ],
        },
      ],
    },
    {
      id: "shortcuts",
      title: "11. 단축키",
      blocks: [
        {
          type: "paragraph",
          text: "자주 쓰는 단축키입니다. 새 단축키가 추가되면 이 목록만 업데이트하면 됩니다.",
        },
        { type: "shortcut", keys: "Ctrl + K / ⌘ + K", action: "프로젝트 전체 검색" },
        { type: "shortcut", keys: "Esc", action: "모달 · 검색 닫기" },
        { type: "shortcut", keys: "↑ / ↓", action: "검색 결과 이동" },
        { type: "shortcut", keys: "Enter", action: "검색 결과 열기" },
        { type: "shortcut", keys: "@", action: "원고에서 캐릭터 멘션" },
      ],
    },
    {
      id: "faq",
      title: "12. FAQ",
      blocks: [
        {
          type: "faq",
          question: "자동 저장되나요?",
          answer: "예. 자동 저장됩니다. Settings에서 저장 간격을 조절할 수 있습니다.",
        },
        {
          type: "faq",
          question: "인터넷이 끊기면?",
          answer:
            "Auto Recovery가 동작합니다. 브라우저에 임시 초안이 남아 다시 접속했을 때 복구할 수 있습니다.",
        },
        {
          type: "faq",
          question: "iPad에서도 사용할 수 있나요?",
          answer:
            "예. 같은 계정으로 로그인하면 이어서 작성할 수 있습니다. 브라우저로 Novel Studio에 접속하면 됩니다.",
        },
        {
          type: "faq",
          question: "작품을 삭제하면 복구할 수 있나요?",
          answer:
            "삭제된 작품과 연결된 데이터는 복구할 수 없습니다. 삭제 전 확인 창을 꼭 읽어 주세요.",
        },
        {
          type: "faq",
          question: "검색은 어디서 하나요?",
          answer:
            "상단의 🔍 버튼 또는 Ctrl+K(Mac은 ⌘+K)로 프로젝트 전체 검색을 엽니다.",
        },
      ],
    },
  ],
};
