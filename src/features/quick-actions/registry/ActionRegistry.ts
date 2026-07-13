/**
 * =============================================================================
 * Action Registry
 * -----------------------------------------------------------------------------
 * 사용 가능한 Action 목록을 등록·조회한다.
 * Open/Closed: 새 Action 추가 시 Registry.register 만 하면 되고
 * Quick Actions UI · Action Engine 코드는 수정하지 않는다.
 * =============================================================================
 */

import type { QuickAction } from "@/features/quick-actions/types";

export class ActionRegistry {
  private readonly actions = new Map<string, QuickAction>();

  /** Action 등록. 동일 id 는 덮어쓴다. */
  register(action: QuickAction): void {
    this.actions.set(action.id, action);
  }

  /** 여러 Action 을 한 번에 등록 */
  registerAll(actions: readonly QuickAction[]): void {
    for (const action of actions) {
      this.register(action);
    }
  }

  /** 등록 해제 (테스트·임시 Dummy 제거용) */
  unregister(id: string): void {
    this.actions.delete(id);
  }

  get(id: string): QuickAction | undefined {
    return this.actions.get(id);
  }

  has(id: string): boolean {
    return this.actions.has(id);
  }

  /**
   * 등록된 전체 Action (priority 오름차순, 동일 시 label).
   * Quick Actions 가 버튼을 그릴 때 사용한다.
   */
  list(): QuickAction[] {
    return [...this.actions.values()].sort((a, b) => {
      const pa = a.priority ?? 100;
      const pb = b.priority ?? 100;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label, "ko");
    });
  }

  clear(): void {
    this.actions.clear();
  }

  get size(): number {
    return this.actions.size;
  }
}

/** 빈 Registry 팩토리 — 페이지마다 독립 인스턴스를 만든다 */
export function createActionRegistry(
  initial?: readonly QuickAction[],
): ActionRegistry {
  const registry = new ActionRegistry();
  if (initial?.length) registry.registerAll(initial);
  return registry;
}
