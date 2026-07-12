/**
 * =============================================================================
 * Export — PDF (A4 · 여백 · 제목 · 페이지 번호 · 한글 줄바꿈)
 * -----------------------------------------------------------------------------
 * jsPDF + Pretendard(로컬 TTF). CJK 는 글자 단위로 폭을 재며 줄바꿈한다.
 * 본문 색상 마커(·ns:fg:…)는 setTextColor 로 유지한다.
 * =============================================================================
 */

import { jsPDF } from "jspdf";
import type { ExportPayload } from "@/features/export/types/export-options";
import {
  downloadBlob,
  exportTimestamp,
  sanitizeFilename,
} from "@/features/export/lib/download-blob";
import {
  MANUSCRIPT_FG_PDF,
  parseManuscriptColorRuns,
  type ManuscriptFgColor,
  type ManuscriptTextRun,
} from "@/features/manuscript/lib/manuscript-markup";

const FONT_NAME = "Pretendard";
const FONT_FILE = "Pretendard-Regular.ttf";
/** Next public 경로 — 오프라인·iPad 에서도 동일 오리진으로 로드 */
const FONT_URL = `/fonts/${FONT_FILE}`;

let fontBase64Cache: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadKoreanFontBase64(): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache;
  const response = await fetch(FONT_URL);
  if (!response.ok) {
    throw new Error(
      "한글 폰트(/fonts/Pretendard-Regular.ttf)를 불러오지 못했습니다.",
    );
  }
  const buffer = await response.arrayBuffer();
  fontBase64Cache = arrayBufferToBase64(buffer);
  return fontBase64Cache;
}

type ColoredLine = ManuscriptTextRun[];

/**
 * 색상 run 을 maxWidth 에 맞게 줄 단위로 나눈다.
 * 각 출력 줄은 색이 다른 조각들의 배열이다.
 */
function wrapColoredRuns(
  doc: jsPDF,
  runs: ManuscriptTextRun[],
  maxWidth: number,
): ColoredLine[] {
  const lines: ColoredLine[] = [];
  let currentLine: ColoredLine = [];
  let currentWidth = 0;

  const flushLine = () => {
    lines.push(currentLine.length > 0 ? currentLine : [{ text: "", color: "k" }]);
    currentLine = [];
    currentWidth = 0;
  };

  const pushPiece = (text: string, color: ManuscriptFgColor) => {
    if (!text) return;
    const last = currentLine[currentLine.length - 1];
    if (last && last.color === color) {
      last.text += text;
    } else {
      currentLine.push({ text, color });
    }
  };

  for (const run of runs) {
    const normalized = run.text.replace(/\r\n/g, "\n");
    const paragraphs = normalized.split("\n");

    for (let p = 0; p < paragraphs.length; p += 1) {
      if (p > 0) flushLine();
      const chars = Array.from(paragraphs[p]);
      let pending = "";

      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i];
        const trial = pending + ch;
        const trialWidth = doc.getTextWidth(trial);
        if (currentWidth + trialWidth <= maxWidth) {
          pending = trial;
          continue;
        }

        // 넘침 — pending 확정 후 새 줄
        if (pending) {
          const spaceIdx = pending.lastIndexOf(" ");
          if (spaceIdx > 0 && /[A-Za-z0-9]/.test(ch)) {
            pushPiece(pending.slice(0, spaceIdx), run.color);
            flushLine();
            pending = pending.slice(spaceIdx + 1) + ch;
            currentWidth = doc.getTextWidth(pending);
          } else {
            pushPiece(pending, run.color);
            flushLine();
            pending = ch === " " ? "" : ch;
            currentWidth = pending ? doc.getTextWidth(pending) : 0;
          }
        } else if (currentLine.length > 0) {
          flushLine();
          pending = ch === " " ? "" : ch;
          currentWidth = pending ? doc.getTextWidth(pending) : 0;
        } else {
          pushPiece(ch, run.color);
          flushLine();
          pending = "";
          currentWidth = 0;
        }
      }
      if (pending) {
        pushPiece(pending, run.color);
        currentWidth += doc.getTextWidth(pending);
      }
    }
  }

  if (currentLine.length > 0 || lines.length === 0) flushLine();
  return lines;
}

function registerFont(doc: jsPDF, base64: string): void {
  doc.addFileToVFS(FONT_FILE, base64);
  doc.addFont(FONT_FILE, FONT_NAME, "normal");
  doc.setFont(FONT_NAME, "normal");
}

function applyFgColor(doc: jsPDF, color: ManuscriptFgColor): void {
  const [r, g, b] = MANUSCRIPT_FG_PDF[color];
  doc.setTextColor(r, g, b);
}

function drawColoredLine(
  doc: jsPDF,
  line: ColoredLine,
  x: number,
  y: number,
): void {
  let cursorX = x;
  for (const run of line) {
    if (!run.text) continue;
    applyFgColor(doc, run.color);
    doc.text(run.text, cursorX, y);
    cursorX += doc.getTextWidth(run.text);
  }
  // 기본색 복원 (푸터 등)
  doc.setTextColor(0);
}

/** 제목 등 단색 줄바꿈 (기존 로직) */
function wrapPlainText(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [""];
  const lines: string[] = [];
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }
    let current = "";
    const chars = Array.from(paragraph);
    for (let i = 0; i < chars.length; i += 1) {
      const ch = chars[i];
      const next = current + ch;
      if (doc.getTextWidth(next) <= maxWidth) {
        current = next;
        continue;
      }
      if (current) {
        const spaceIdx = current.lastIndexOf(" ");
        if (spaceIdx > 0 && /[A-Za-z0-9]/.test(ch)) {
          lines.push(current.slice(0, spaceIdx));
          current = current.slice(spaceIdx + 1) + ch;
        } else {
          lines.push(current);
          current = ch === " " ? "" : ch;
        }
      } else {
        lines.push(ch);
        current = "";
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function exportAsPdf(payload: ExportPayload): Promise<boolean> {
  const fontBase64 = await loadKoreanFontBase64();
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  registerFont(doc, fontBase64);

  // A4 여백 (약 20mm)
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const topContent = margin + 12;
  const bottomLimit = pageHeight - margin - 10;

  const title = payload.projectTitle || payload.title;

  // 표지 제목은 별도 렌더 — 본문에는 Document/부록만 (색상 마커 유지)
  const bodyChunks: string[] = [];
  for (let i = 0; i < payload.documents.length; i += 1) {
    const docBlock = payload.documents[i];
    if (payload.documents.length > 1) {
      bodyChunks.push(`【${docBlock.title}】`, "");
    }
    if (docBlock.body.trim()) bodyChunks.push(docBlock.body.trim());
    if (i < payload.documents.length - 1) {
      bodyChunks.push("", "————————", "");
    }
  }
  if (payload.appendix.trim()) {
    bodyChunks.push("", payload.appendix.trim());
  }
  const bodyText =
    bodyChunks.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

  const fontSize = 11;
  const lineHeight = 7;

  doc.setFontSize(fontSize);

  // —— 표지 제목 (첫 페이지 상단) ——
  doc.setFontSize(18);
  const titleLines = wrapPlainText(doc, title, contentWidth);
  let y = margin;
  for (const line of titleLines) {
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += 9;
  }
  y += 6;
  doc.setFontSize(fontSize);

  const contentLines = wrapColoredRuns(
    doc,
    parseManuscriptColorRuns(bodyText),
    contentWidth,
  );

  const drawFooter = (pageNumber: number) => {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(String(pageNumber), pageWidth / 2, pageHeight - 12, {
      align: "center",
    });
    doc.setTextColor(0);
    doc.setFontSize(fontSize);
  };

  // 첫 페이지 헤더 제목(작은 글씨) — 본문이 길 때 이후 페이지용
  const drawHeader = () => {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(title, margin, margin - 4);
    doc.setTextColor(0);
    doc.setFontSize(fontSize);
  };

  let pageNumber = 1;
  drawFooter(pageNumber);

  for (const line of contentLines) {
    if (y + lineHeight > bottomLimit) {
      doc.addPage();
      pageNumber += 1;
      registerFont(doc, fontBase64);
      drawHeader();
      drawFooter(pageNumber);
      y = topContent;
    }
    if (line.length === 1 && !line[0].text) {
      // 빈 줄
    } else {
      drawColoredLine(doc, line, margin, y);
    }
    y += lineHeight;
  }

  const blob = doc.output("blob");
  const filename = `${sanitizeFilename(payload.title)}_${exportTimestamp()}.pdf`;
  return downloadBlob(blob, filename);
}
