/**
 * =============================================================================
 * Export — DOCX (Microsoft Word 호환)
 * -----------------------------------------------------------------------------
 * `docx` 패키지로 OOXML 생성. Word / Pages / Google Docs 에서 바로 열림.
 * 본문 색상 마커(·ns:fg:…)는 TextRun color 로 유지한다.
 * =============================================================================
 */

import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import type { ExportPayload } from "@/features/export/types/export-options";
import {
  downloadBlob,
  exportTimestamp,
  sanitizeFilename,
} from "@/features/export/lib/download-blob";
import {
  MANUSCRIPT_FG_DOCX,
  splitColorRunsByLine,
  type ManuscriptFgColor,
} from "@/features/manuscript/lib/manuscript-markup";

function textRunsFromLine(
  lineRuns: { text: string; color: ManuscriptFgColor }[],
): TextRun[] {
  if (lineRuns.length === 0 || (lineRuns.length === 1 && !lineRuns[0].text)) {
    return [];
  }
  return lineRuns.map(
    (run) =>
      new TextRun({
        text: run.text,
        font: "Malgun Gothic",
        size: 22, // 11pt
        ...(run.color !== "k"
          ? { color: MANUSCRIPT_FG_DOCX[run.color] }
          : {}),
      }),
  );
}

function paragraphsFromText(text: string): Paragraph[] {
  const lines = splitColorRunsByLine(text);
  const result: Paragraph[] = [];

  for (const lineRuns of lines) {
    const children = textRunsFromLine(lineRuns);
    if (children.length === 0) {
      result.push(new Paragraph({ children: [] }));
      continue;
    }
    result.push(
      new Paragraph({
        spacing: { after: 120, line: 360 },
        children,
      }),
    );
  }
  return result;
}

export async function exportAsDocx(payload: ExportPayload): Promise<boolean> {
  const children: Paragraph[] = [];

  // 표지 제목
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: payload.projectTitle || payload.title,
          bold: true,
          font: "Malgun Gothic",
          size: 36,
        }),
      ],
    }),
  );

  if (
    payload.title !== payload.projectTitle &&
    payload.documents.length === 1
  ) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: payload.title,
            font: "Malgun Gothic",
            size: 26,
            color: "555555",
          }),
        ],
      }),
    );
  }

  for (let i = 0; i < payload.documents.length; i += 1) {
    const doc = payload.documents[i];
    if (payload.documents.length > 1) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 200 },
          children: [
            new TextRun({
              text: doc.title,
              bold: true,
              font: "Malgun Gothic",
              size: 28,
            }),
          ],
        }),
      );
    }
    children.push(...paragraphsFromText(doc.body));
  }

  if (payload.appendix.trim()) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 200 },
        children: [
          new TextRun({
            text: "부록",
            bold: true,
            font: "Malgun Gothic",
            size: 28,
          }),
        ],
      }),
    );
    children.push(...paragraphsFromText(payload.appendix));
  }

  const document = new Document({
    creator: "Novel Studio",
    title: payload.title,
    description: `Exported from Novel Studio · ${payload.generatedAt}`,
    sections: [
      {
        properties: {
          page: {
            // A4 (DXA: 1 inch = 1440)
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1134, // ~20mm
              right: 1134,
              bottom: 1134,
              left: 1134,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  const filename = `${sanitizeFilename(payload.title)}_${exportTimestamp()}.docx`;
  return downloadBlob(blob, filename);
}
