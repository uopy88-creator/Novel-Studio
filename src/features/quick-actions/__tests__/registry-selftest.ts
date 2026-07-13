/**
 * Action Registry OCP self-test
 * Run: npx --yes tsx src/features/quick-actions/__tests__/registry-selftest.ts
 *
 * Dummy Action 을 등록만 하면 list / Engine 에 자동 반영되는지 검증한 뒤 제거한다.
 */

import assert from "node:assert/strict";
import {
  createActionEngine,
  createActionRegistry,
  createInspirationSaveAction,
  createSentenceAssistantAction,
  type QuickAction,
  type QuickActionContext,
} from "@/features/quick-actions";

async function main() {
  const registry = createActionRegistry();
  const engine = createActionEngine(registry);

  const ctx: QuickActionContext = {
    selection: { text: "샘플", start: 0, end: 2 },
    textarea: null,
  };

  let saOpened = false;
  let inspSaved = false;

  registry.register(
    createSentenceAssistantAction({
      openAssistant: () => {
        saOpened = true;
      },
    }),
  );
  registry.register(
    createInspirationSaveAction({
      saveInspiration: () => {
        inspSaved = true;
      },
    }),
  );

  assert.equal(registry.size, 2);
  assert.deepEqual(
    engine.getAvailableActions(ctx).map((a) => a.id),
    ["sentence-assistant", "inspiration-save"],
  );

  await engine.run("sentence-assistant", ctx);
  await engine.run("inspiration-save", ctx);
  assert.equal(saOpened, true);
  assert.equal(inspSaved, true);

  // —— Dummy Action: 등록만으로 버튼 목록에 나타나는지 ——
  const dummy: QuickAction = {
    id: "dummy-action",
    label: "Dummy",
    icon: "🧪",
    priority: 5,
    isAvailable: () => true,
    execute: () => {
      // no-op
    },
  };

  registry.register(dummy);
  assert.ok(registry.has("dummy-action"));
  assert.deepEqual(
    engine.getAvailableActions(ctx).map((a) => a.id),
    ["dummy-action", "sentence-assistant", "inspiration-save"],
  );

  let dummyRan = false;
  registry.register({
    ...dummy,
    execute: () => {
      dummyRan = true;
    },
  });
  await engine.run("dummy-action", ctx);
  assert.equal(dummyRan, true);

  // Dummy 제거 — 프로덕션 Registry 에 남지 않음
  registry.unregister("dummy-action");
  assert.equal(registry.has("dummy-action"), false);
  assert.deepEqual(
    engine.getAvailableActions(ctx).map((a) => a.id),
    ["sentence-assistant", "inspiration-save"],
  );

  console.log("quick-actions registry-selftest: ok");
}

void main();
