/**
 * Self-test: Manuscript edit history (Undo/Redo)
 * Run: npx --yes tsx src/features/manuscript/lib/__tests__/manuscript-edit-history-selftest.ts
 */

import assert from "node:assert/strict";
import {
  canRedoManuscript,
  canUndoManuscript,
  getManuscriptHistoryDebug,
  recordManuscriptEdit,
  recordManuscriptTransaction,
  redoManuscript,
  resetManuscriptHistory,
  runWithoutManuscriptHistory,
  undoManuscript,
  MANUSCRIPT_HISTORY_LIMIT,
} from "@/features/manuscript/lib/manuscript-edit-history";
import type { ProjectId } from "@/types/ids";

const projectId = "hist-test" as ProjectId;

resetManuscriptHistory(projectId, "A");

// coalesce: first edit pushes A, then B and C in same window still one undo to A
recordManuscriptEdit(projectId, "AB");
recordManuscriptEdit(projectId, "ABC");
assert.equal(canUndoManuscript(projectId), true);
assert.equal(undoManuscript(projectId)?.content, "A");
assert.equal(getManuscriptHistoryDebug(projectId).present, "A");

// redo
assert.equal(canRedoManuscript(projectId), true);
assert.equal(redoManuscript(projectId)?.content, "ABC");

// transaction = one step
recordManuscriptTransaction(projectId, "SECTIONED");
assert.equal(undoManuscript(projectId)?.content, "ABC");
assert.equal(redoManuscript(projectId)?.content, "SECTIONED");

// new edit clears future
recordManuscriptTransaction(projectId, "NEW");
assert.equal(canRedoManuscript(projectId), false);
assert.equal(undoManuscript(projectId)?.content, "SECTIONED");

// silent restore
runWithoutManuscriptHistory(projectId, () => {
  recordManuscriptEdit(projectId, "SHOULD_NOT_STACK");
});
resetManuscriptHistory(projectId, "LOADED");
assert.equal(canUndoManuscript(projectId), false);

// capacity
resetManuscriptHistory(projectId, "0");
for (let i = 1; i <= MANUSCRIPT_HISTORY_LIMIT + 20; i += 1) {
  recordManuscriptTransaction(projectId, String(i));
}
assert.ok(
  getManuscriptHistoryDebug(projectId).pastLength <= MANUSCRIPT_HISTORY_LIMIT,
);

console.log("manuscript-edit-history-selftest: all assertions passed (PASS)");
