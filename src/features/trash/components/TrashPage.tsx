"use client";

/**
 * =============================================================================
 * TrashPage — Soft Delete 휴지통
 * -----------------------------------------------------------------------------
 * Studio 사이드바 독립 메뉴(Memo ↔ Settings 사이). 복원 / 영구삭제.
 * =============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectId } from "@/types/ids";
import {
  TRASH_ENTITY_LABELS,
  TRASH_RETENTION_DAYS,
  listTrash,
  permanentDelete,
  restore,
  type TrashEntityType,
  type TrashItem,
} from "@/features/trash";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatShortDate, formatShortTime } from "@/lib/format-date";

export interface TrashPageProps {
  projectId: ProjectId;
}

export function TrashPage({ projectId }: TrashPageProps) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingPurge, setPendingPurge] = useState<TrashItem | null>(null);
  const [filter, setFilter] = useState<TrashEntityType | "all">("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listTrash(projectId));
    } catch (error) {
      console.error("[TrashPage] load failed", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.entityType === filter);
  }, [filter, items]);

  const handleRestore = async (item: TrashItem) => {
    setBusyId(item.id);
    try {
      await restore(item.id, projectId);
      await refresh();
    } catch (error) {
      console.error("[TrashPage] restore failed", error);
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanent = async () => {
    if (!pendingPurge) return;
    const id = pendingPurge.id;
    setBusyId(id);
    try {
      await permanentDelete(id);
      setPendingPurge(null);
      await refresh();
    } catch (error) {
      console.error("[TrashPage] permanent delete failed", error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ContentContainer>
      <header className="mb-ns-6">
        <p className="ns-caption mb-ns-2">Studio</p>
        <h2 className="ns-heading">Trash</h2>
        <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
          삭제한 항목이 여기로 이동합니다. 복원하거나 영구삭제할 수 있습니다.
          {TRASH_RETENTION_DAYS}일 후 자동 삭제할 수 있도록 만료일이 함께
          기록됩니다.
        </p>
      </header>

      <div className="mb-ns-4 flex flex-wrap gap-ns-2">
        <FilterChip
          active={filter === "all"}
          label="전체"
          onClick={() => setFilter("all")}
        />
        {(Object.keys(TRASH_ENTITY_LABELS) as TrashEntityType[]).map(
          (type) => (
            <FilterChip
              key={type}
              active={filter === type}
              label={TRASH_ENTITY_LABELS[type]}
              onClick={() => setFilter(type)}
            />
          ),
        )}
      </div>

      {loading ? (
        <p className="text-ns-sm text-ns-ink-tertiary">불러오는 중…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-ns-xl border border-dashed border-ns-border px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          휴지통이 비어 있습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-ns-xl border border-ns-border">
          <table className="w-full min-w-[36rem] text-left text-ns-sm">
            <thead className="border-b border-ns-border bg-ns-muted/40 text-ns-xs text-ns-ink-secondary">
              <tr>
                <th className="px-ns-4 py-ns-3 font-medium">종류</th>
                <th className="px-ns-4 py-ns-3 font-medium">이름</th>
                <th className="px-ns-4 py-ns-3 font-medium">삭제 날짜</th>
                <th className="px-ns-4 py-ns-3 font-medium">만료</th>
                <th className="px-ns-4 py-ns-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-ns-border last:border-b-0"
                >
                  <td className="px-ns-4 py-ns-3 text-ns-ink-secondary">
                    {TRASH_ENTITY_LABELS[item.entityType]}
                  </td>
                  <td className="px-ns-4 py-ns-3 font-medium text-ns-ink">
                    {item.name}
                  </td>
                  <td className="px-ns-4 py-ns-3 text-ns-ink-secondary">
                    {formatShortDate(item.deletedAt)}{" "}
                    {formatShortTime(item.deletedAt)}
                  </td>
                  <td className="px-ns-4 py-ns-3 text-ns-ink-tertiary">
                    {formatShortDate(item.expiresAt)}
                  </td>
                  <td className="px-ns-4 py-ns-3">
                    <div className="flex flex-wrap justify-end gap-ns-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === item.id}
                        onClick={() => void handleRestore(item)}
                      >
                        복원
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={busyId === item.id}
                        onClick={() => setPendingPurge(item)}
                      >
                        영구삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={Boolean(pendingPurge)}
        onClose={() => setPendingPurge(null)}
        title="삭제하시겠습니까?"
        description="영구삭제하면 되돌릴 수 없습니다."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingPurge(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={busyId === pendingPurge?.id}
              onClick={() => void handlePermanent()}
            >
              영구삭제
            </Button>
          </>
        }
      >
        {pendingPurge ? (
          <p className="text-ns-sm text-ns-ink-secondary">
            {TRASH_ENTITY_LABELS[pendingPurge.entityType]} ·{" "}
            <span className="font-medium text-ns-ink">{pendingPurge.name}</span>
          </p>
        ) : null}
      </Modal>
    </ContentContainer>
  );
}

function FilterChip(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        props.active
          ? "rounded-ns-full bg-ns-accent-soft px-ns-3 py-ns-1 text-ns-xs font-medium text-ns-ink"
          : "rounded-ns-full border border-ns-border px-ns-3 py-ns-1 text-ns-xs text-ns-ink-secondary hover:bg-ns-muted"
      }
    >
      {props.label}
    </button>
  );
}
