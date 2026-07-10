/**
 * =============================================================================
 * Sync Service (스텁)
 * -----------------------------------------------------------------------------
 * LocalStorage ↔ Supabase 동기화는 아직 없다.
 * 이후 충돌 해결·업로드·다운로드를 이 서비스에 모은다.
 * =============================================================================
 */

export type SyncStatus = "idle" | "syncing" | "error" | "disabled";

export interface SyncResult {
  status: SyncStatus;
  message: string;
  syncedAt?: string;
}

export class SyncService {
  /** 현재는 항상 disabled — 클라우드 미연결 */
  async syncNow(): Promise<SyncResult> {
    return {
      status: "disabled",
      message:
        "Cloud sync is not implemented yet. Data stays in LocalStorage.",
    };
  }

  getStatus(): SyncStatus {
    return "disabled";
  }
}

export const syncService = new SyncService();
