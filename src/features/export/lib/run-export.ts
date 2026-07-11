/**
 * =============================================================================
 * runExport — 형식별 생성기 디스패치
 * -----------------------------------------------------------------------------
 * docx / jspdf 는 다운로드 순간에만 동적 import 한다.
 * (Manuscript 초기 로드가 무거운 PDF 번들에 막히지 않도록)
 * =============================================================================
 */

import type {
  ExportFormat,
  ExportPayload,
} from "@/features/export/types/export-options";

export async function runExport(
  format: ExportFormat,
  payload: ExportPayload,
): Promise<boolean> {
  switch (format) {
    case "txt": {
      const { exportAsTxt } = await import(
        "@/features/export/lib/formats/export-txt"
      );
      return exportAsTxt(payload);
    }
    case "docx": {
      const { exportAsDocx } = await import(
        "@/features/export/lib/formats/export-docx"
      );
      return exportAsDocx(payload);
    }
    case "pdf": {
      const { exportAsPdf } = await import(
        "@/features/export/lib/formats/export-pdf"
      );
      return exportAsPdf(payload);
    }
    default: {
      const _exhaustive: never = format;
      throw new Error(`지원하지 않는 형식: ${_exhaustive}`);
    }
  }
}
