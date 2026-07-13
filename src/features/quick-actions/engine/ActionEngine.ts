/**
 * =============================================================================
 * Action Engine
 * -----------------------------------------------------------------------------
 * Action 실행만 담당한다.
 * Quick Actions UI 는 Engine.run 만 호출하고, Action 구현을 직접 알지 않는다.
 * =============================================================================
 */

import type { ActionRegistry } from "@/features/quick-actions/registry/ActionRegistry";
import type {
  QuickAction,
  QuickActionContext,
} from "@/features/quick-actions/types";

export class ActionEngine {
  constructor(private readonly registry: ActionRegistry) {}

  /** 현재 컨텍스트에서 사용 가능한 Action 목록 (Registry 정렬 유지) */
  getAvailableActions(ctx: QuickActionContext): QuickAction[] {
    return this.registry.list().filter((action) => {
      try {
        return action.isAvailable(ctx);
      } catch (error) {
        console.error(
          `[ActionEngine] isAvailable failed for ${action.id}`,
          error,
        );
        return false;
      }
    });
  }

  /**
   * id 로 Action 을 찾아 실행한다.
   * 없거나 사용 불가면 false.
   */
  async run(id: string, ctx: QuickActionContext): Promise<boolean> {
    const action = this.registry.get(id);
    if (!action) {
      console.warn(`[ActionEngine] unknown action: ${id}`);
      return false;
    }

    try {
      if (!action.isAvailable(ctx)) return false;
      await action.execute(ctx);
      return true;
    } catch (error) {
      console.error(`[ActionEngine] execute failed for ${id}`, error);
      return false;
    }
  }
}

export function createActionEngine(registry: ActionRegistry): ActionEngine {
  return new ActionEngine(registry);
}
