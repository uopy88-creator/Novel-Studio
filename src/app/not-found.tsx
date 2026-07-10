import Link from "next/link";

/**
 * 없는 경로용 페이지.
 * Next.js 빌드 시 /_not-found 모듈이 필요하므로 명시적으로 둔다.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-ns-6 text-center">
      <p className="ns-caption mb-ns-2">Novel Studio</p>
      <h1 className="ns-title mb-ns-3">페이지를 찾을 수 없습니다</h1>
      <p className="mb-ns-8 text-ns-sm text-ns-ink-secondary">
        주소를 확인하거나 작품 목록으로 돌아가 주세요.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-ns-touch items-center justify-center rounded-ns-md bg-ns-accent px-ns-5 text-ns-sm font-medium text-ns-ink-inverse hover:bg-ns-accent-hover"
      >
        작품 목록으로
      </Link>
    </div>
  );
}
