/**
 * =============================================================================
 * downloadBlob — PC / Mac / iPad 공통 파일 다운로드
 * -----------------------------------------------------------------------------
 * - 데스크톱: <a download> + Object URL
 * - iPad/iOS: download 속성이 막히는 경우가 있어 Web Share API 로 폴백
 * =============================================================================
 */

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ 는 Mac처럼 보이므로 maxTouchPoints 로 보정
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

/**
 * Blob 을 사용자 기기에 저장한다.
 * @returns 성공 여부 (Share 취소 시 false 가능)
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  // iPad: 가능하면 공유 시트로 저장 (파일 앱 / 파일에 저장)
  if (
    isAppleTouchDevice() &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    try {
      const file = new File([blob], filename, {
        type: blob.type || "application/octet-stream",
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return true;
      }
    } catch (error) {
      // 사용자가 공유를 취소한 경우 — 조용히 앵커 다운로드로 폴백
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } finally {
    // iOS 가 다운로드를 시작하기 전에 revoke 하면 실패할 수 있어 지연
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
  }
}

/** 파일명에 쓸 수 없는 문자 제거 */
export function sanitizeFilename(name: string): string {
  const trimmed = name.trim() || "export";
  return trimmed
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

/** YYYYMMDD-HHmm 타임스탬프 */
export function exportTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  );
}
