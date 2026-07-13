/**
 * Section Registry SSOT — 교차 기능 회귀 테스트
 * Run: npx --yes tsx src/features/sections/__tests__/section-registry-ssot-selftest.ts
 */

import assert from "node:assert/strict";
import {
  formatSectionRefLabel,
  getSectionRegistrySnapshot,
  publishSections,
  resetSectionRegistry,
  sectionOptionsFromRefs,
  sectionRefsFromContent,
  mergeSectionBodiesById,
  findSectionStableIdAtOffset,
} from "@/features/sections";
import type { ProjectId, DocumentId } from "@/types/ids";

const projectId = "proj-ssot" as ProjectId;
const primary = "doc-primary" as DocumentId;

resetSectionRegistry(projectId);

const content = `#1 프롤로그 ·ns:section_001
Once.

#2 첫 만남 ·ns:section_002
Hello.

#3 갈등 ·ns:section_003
Conflict.`;

const refs = sectionRefsFromContent(content);
assert.equal(refs.length, 3);
assert.equal(formatSectionRefLabel(refs[0]), "#1 프롤로그");

publishSections(projectId, {
  sections: refs,
  primaryDocumentId: primary,
  source: "live",
});

// 모든 소비자가 동일 스냅샷
const snap = getSectionRegistrySnapshot(projectId);
assert.equal(snap.sections.length, 3);
assert.equal(snap.primaryDocumentId, primary);

const options = sectionOptionsFromRefs(snap.sections, snap.primaryDocumentId);
assert.equal(options[1].label, "#2 첫 만남");
assert.equal(options[1].sectionStableId, "section_002");
assert.equal(options[1].value, "section_002");

// 재번호 시뮬레이션 — ID 유지
publishSections(projectId, {
  sections: [
    { id: "section_002", number: 1, title: "첫 만남" },
    { id: "section_001", number: 2, title: "프롤로그" },
    { id: "section_003", number: 3, title: "갈등" },
  ],
  primaryDocumentId: primary,
  source: "live",
});
const afterReorder = getSectionRegistrySnapshot(projectId);
assert.equal(
  afterReorder.sections.find((s) => s.id === "section_001")?.number,
  2,
);
assert.equal(
  formatSectionRefLabel(
    afterReorder.sections.find((s) => s.id === "section_001")!,
  ),
  "#2 프롤로그",
);

// Search 병합: Registry 순서 + body
const merged = mergeSectionBodiesById(refs, content);
assert.ok(merged[0].body.includes("Once"));
assert.equal(merged[0].id, "section_001");

// Inspiration 오프셋 → Section ID
const idAt = findSectionStableIdAtOffset(content, content.indexOf("Hello"));
assert.equal(idAt, "section_002");

// 빈 원고
assert.deepEqual(sectionRefsFromContent(""), []);

resetSectionRegistry(projectId);
console.log("section-registry-ssot-selftest: all assertions passed (PASS)");
