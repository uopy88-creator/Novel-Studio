/**
 * Self-test: section-metas-repo missing-column detection
 * Run: npx --yes tsx src/database/supabase/__tests__/section-metas-repo-selftest.ts
 */

import assert from "node:assert/strict";
import { isMissingScenesColumnError } from "@/database/supabase/section-metas-repo";

assert.equal(
  isMissingScenesColumnError({
    code: "42703",
    message: "column scenes.icons does not exist",
  }),
  true,
  "42703 should be treated as missing column",
);

assert.equal(
  isMissingScenesColumnError({
    code: "PGRST204",
    message: "Could not find the 'section_number' column of 'scenes' in the schema cache",
  }),
  true,
  "PGRST204 should be treated as missing column",
);

assert.equal(
  isMissingScenesColumnError({
    code: "42501",
    message: "permission denied for table scenes",
  }),
  false,
  "permission errors must not be treated as missing column",
);

assert.equal(
  isMissingScenesColumnError(null),
  false,
);

console.log("section-metas-repo-selftest: all assertions passed (PASS)");
