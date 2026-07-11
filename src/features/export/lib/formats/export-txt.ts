/**
 * =============================================================================
 * Export — TXT (UTF-8)
 * =============================================================================
 */

import type { ExportPayload } from "@/features/export/types/export-options";
import { payloadToPlainText } from "@/features/export/lib/build-export-payload";
import {
  downloadBlob,
  exportTimestamp,
  sanitizeFilename,
} from "@/features/export/lib/download-blob";

export async function exportAsTxt(payload: ExportPayload): Promise<boolean> {
  const text = payloadToPlainText(payload);
  // BOM 없이 UTF-8 — 현대 에디터·Word·메모장 모두 인식
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const filename = `${sanitizeFilename(payload.title)}_${exportTimestamp()}.txt`;
  return downloadBlob(blob, filename);
}
