/**
 * =============================================================================
 * Show / Tell 자가 검증 스크립트 (개발자 전용)
 * -----------------------------------------------------------------------------
 * Tell 20+ / Show 20+ 문장으로 ShowTellEngine 판정을 확인한다.
 *
 * 실행: npm run test:show-tell
 * =============================================================================
 */

import {
  runShowTellSelfTest,
  showTellEngine,
} from "../src/features/sentence-assistant/engines/show-tell/ShowTellEngine";

const result = runShowTellSelfTest(showTellEngine);

console.log("=== Show / Tell Self Test ===");
console.log(
  `Tell: ${result.tellPassed}/${result.tellTotal} passed`,
);
console.log(
  `Show: ${result.showPassed}/${result.showTotal} passed`,
);

if (result.failures.length > 0) {
  console.log("\nFailures:");
  for (const f of result.failures) {
    console.log(`  [${f.expected}→${f.got}] ${f.sentence}`);
  }
  process.exit(1);
}

// 작법 예시가 스타일마다 여러 개인지 확인 (문장 생성 아님)
const styles = ["action", "expression", "dialogue", "setting"] as const;
for (const style of styles) {
  const { examples } = showTellEngine.getCraftExamples("그는 슬펐다.", style);
  if (examples.length < 2) {
    console.error(`Expected multiple craft examples for ${style}, got ${examples.length}`);
    process.exit(1);
  }
}

console.log("\nCraft examples: OK (multiple independent samples per style)");
console.log("All Show / Tell tests passed.");
