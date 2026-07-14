"use client";

/**
 * =============================================================================
 * TimelinePage
 * -----------------------------------------------------------------------------
 * 사건을 시간순으로 정리. 드래그로 순서 변경.
 * Section 연결은 primary Manuscript 만 사용 (구 Chapter 데이터 무시).
 * =============================================================================
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Character } from "@/features/characters/types/character";
import type { TimelineEvent } from "@/features/timeline/types/timeline-event";
import type { ProjectId } from "@/types/ids";
import { useTimelineEvents } from "@/features/timeline/hooks/useTimelineEvents";
import { TimelineEventItem } from "@/features/timeline/components/TimelineEventItem";
import { TimelineEventModal } from "@/features/timeline/components/TimelineEventModal";
import { readCharactersByProject } from "@/features/characters/lib/character-storage";
import { manuscriptSearchHref } from "@/features/global-search/lib/search-href";
import { ContentContainer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; event: TimelineEvent };

export interface TimelinePageProps {
  projectId: ProjectId;
  /** Section 페이지에서 넘어온 Manuscript Document / Section */
  initialDocumentId?: string;
  initialSectionId?: string;
}

export function TimelinePage({
  projectId,
  initialDocumentId,
  initialSectionId,
}: TimelinePageProps) {
  const router = useRouter();
  const {
    events,
    sectionOptions,
    primaryDocumentId,
    isReady,
    error,
    create,
    update,
    remove,
    reorder,
  } = useTimelineEvents(projectId);

  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<TimelineEvent | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const chars = await readCharactersByProject(projectId);
      if (!cancelled) setCharacters(chars);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Section 페이지에서 넘어오면 추가 모달을 바로 연다
  useEffect(() => {
    if (!isReady) return;
    if (!initialSectionId) return;
    setModal({ type: "create" });
  }, [isReady, initialSectionId]);

  const sectionLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of sectionOptions) {
      map.set(opt.sectionStableId, opt.label);
    }
    return map;
  }, [sectionOptions]);

  const characterNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of characters) {
      map.set(c.id, c.name.trim() || "이름 없음");
    }
    return map;
  }, [characters]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    void reorder(String(active.id), String(over.id));
  }

  const ids = useMemo(() => events.map((e) => e.id), [events]);
  const resolvedDocumentId =
    primaryDocumentId ?? initialDocumentId ?? undefined;

  return (
    <ContentContainer width="default">
      <header className="mb-ns-8 flex flex-col gap-ns-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ns-caption mb-ns-2">이야기</p>
          <h2 className="ns-heading">Timeline</h2>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            사건을 시간순으로 정리합니다. Section과 연결할 수 있습니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="shrink-0"
        >
          ＋ 사건 추가
        </Button>
      </header>

      {error ? (
        <p className="mb-ns-4 text-ns-sm text-ns-danger" role="alert">
          {error}
        </p>
      ) : null}

      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-ns-xl border border-dashed border-ns-border bg-ns-muted/30 px-ns-6 py-ns-12 text-center">
          <p className="text-ns-base text-ns-ink-secondary">
            아직 사건이 없습니다.
          </p>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-tertiary">
            첫 사건을 추가하거나, Section 페이지에서 Timeline으로 연결하세요.
          </p>
          <Button
            type="button"
            className="mt-ns-4"
            onClick={() => setModal({ type: "create" })}
          >
            ＋ 사건 추가
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-ns-2">
              {events.map((event, index) => (
                <TimelineEventItem
                  key={event.id}
                  event={event}
                  index={index}
                  sectionLabel={
                    event.sectionStableId
                      ? (sectionLabelById.get(event.sectionStableId) ??
                        "연결 해제됨")
                      : undefined
                  }
                  characterName={
                    event.characterId
                      ? characterNameById.get(event.characterId)
                      : undefined
                  }
                  onEdit={(e) => setModal({ type: "edit", event: e })}
                  onDelete={setDeleting}
                  onOpenSection={(e) => {
                    if (!e.sectionStableId || !resolvedDocumentId) return;
                    router.push(
                      manuscriptSearchHref(projectId, resolvedDocumentId, {
                        sectionId: e.sectionStableId,
                      }),
                    );
                  }}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <TimelineEventModal
        open={modal.type !== "closed"}
        mode={modal.type === "edit" ? "edit" : "create"}
        event={modal.type === "edit" ? modal.event : null}
        sectionOptions={sectionOptions}
        characters={characters}
        defaultDocumentId={resolvedDocumentId}
        defaultSectionStableId={initialSectionId}
        onClose={() => setModal({ type: "closed" })}
        onSubmit={async (input) => {
          if (modal.type === "edit") {
            await update(modal.event.id, input);
            return;
          }
          await create(input);
        }}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="사건 삭제"
        description={
          deleting
            ? `「${deleting.title || "제목 없음"}」을(를) 삭제할까요?`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleting(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (!deleting) return;
                void (async () => {
                  await remove(deleting.id);
                  setDeleting(null);
                })();
              }}
            >
              삭제
            </Button>
          </>
        }
      />
    </ContentContainer>
  );
}
