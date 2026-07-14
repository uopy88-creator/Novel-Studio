/**
 * Section Registry SSOT — 교차 기능 회귀 테스트
 * Run: npx --yes tsx src/features/sections/__tests__/section-registry-ssot-selftest.ts
 *
 * hydrate / Provider 는 import 하지 않는다 (Supabase 의존 회피).
 */

import assert from "node:assert/strict";
import {
  formatSectionRefLabel,
  getSectionRegistrySnapshot,
  publishSections,
  resetSectionRegistry,
} from "@/features/sections/section-registry";
import {
  getPrimaryDocumentId,
  getProjectSectionContext,
  getSection,
  getSectionRegistry,
  listSectionOptions,
  listSections,
  findSectionIdAtOffset,
  resolveSectionLabel,
} from "@/features/sections/section-helpers";
import {
  sectionOptionsFromRefs,
} from "@/features/sections/section-options";
import {
  sectionRefsFromContent,
} from "@/features/sections/section-list-from-content";
import {
  findSectionStableIdAtOffset,
  mergeSectionBodiesById,
} from "@/features/sections/resolve-section";
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

const snap = getSectionRegistry(projectId);
assert.equal(snap.sections.length, 3);
assert.equal(snap.primaryDocumentId, primary);
assert.equal(getSectionRegistrySnapshot(projectId).generation, snap.generation);

assert.equal(listSections(projectId).length, 3);
assert.equal(getPrimaryDocumentId(projectId), primary);
assert.equal(getSection(projectId, "section_002")?.title, "첫 만남");
assert.equal(resolveSectionLabel(projectId, "section_002"), "#2 첫 만남");
assert.equal(resolveSectionLabel(projectId, "missing"), null);

const options = listSectionOptions(projectId);
assert.equal(options[1].label, "#2 첫 만남");
assert.equal(options[1].sectionId, "section_002");
assert.equal(options[1].sectionStableId, "section_002");
assert.equal(options[1].value, "section_002");

const legacyOptions = sectionOptionsFromRefs(snap.sections, snap.primaryDocumentId);
assert.equal(legacyOptions[0].sectionId, options[0].sectionId);

const ctx = getProjectSectionContext(projectId);
assert.equal(ctx.sections.length, 3);
assert.equal(ctx.primaryDocumentId, primary);
assert.equal(ctx.ready, true);

publishSections(projectId, {
  sections: [
    { id: "section_002", number: 1, title: "첫 만남" },
    { id: "section_001", number: 2, title: "프롤로그" },
    { id: "section_003", number: 3, title: "갈등" },
  ],
  primaryDocumentId: primary,
  source: "live",
});
assert.equal(resolveSectionLabel(projectId, "section_001"), "#2 프롤로그");

const merged = mergeSectionBodiesById(refs, content);
assert.ok(merged[0].body.includes("Once"));
assert.equal(merged[0].id, "section_001");

const idAt = findSectionIdAtOffset(content, content.indexOf("Hello"));
assert.equal(idAt, "section_002");
assert.equal(
  findSectionStableIdAtOffset(content, content.indexOf("Hello")),
  idAt,
);

assert.deepEqual(sectionRefsFromContent(""), []);

resetSectionRegistry(projectId);
console.log("section-registry-ssot-selftest: all assertions passed (PASS)");
