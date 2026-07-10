"use client";

/**
 * =============================================================================
 * ProjectsPage
 * -----------------------------------------------------------------------------
 * 첫 화면: 작품 목록 + 새 작품 / 수정 / 삭제.
 * Dashboard 등 다른 기능은 여기서 다루지 않는다.
 * =============================================================================
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/features/projects/types/project";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectList } from "@/features/projects/components/ProjectList";
import { ProjectModal } from "@/features/projects/components/ProjectModal";
import { ProjectDeleteDialog } from "@/features/projects/components/ProjectDeleteDialog";
import { useAuth } from "@/auth";
import { Button } from "@/components/ui/Button";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; project: Project };

export function ProjectsPage() {
  const { projects, isReady, create, update, remove } = useProjects();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [deleting, setDeleting] = useState<Project | null>(null);

  const openCreate = () => setModal({ type: "create" });
  const closeModal = () => setModal({ type: "closed" });

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="mx-auto flex min-h-dvh min-h-screen w-full min-w-0 max-w-3xl flex-col px-ns-4 py-ns-8 sm:px-ns-10 sm:py-ns-16">
      {/* 헤더 — Notion/Linear처럼 여백 많고 심플 */}
      <header className="mb-ns-10 flex flex-col gap-ns-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="ns-caption mb-ns-2">Novel Studio</p>
          <h1 className="ns-title">작품</h1>
          <p className="mt-ns-2 text-ns-sm text-ns-ink-secondary">
            작업할 작품을 선택하거나 새로 만드세요.
            {user?.email ? (
              <span className="mt-ns-1 block break-all text-ns-ink-tertiary">
                {user.email}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-ns-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void handleSignOut()}
          >
            로그아웃
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="rounded-ns-full px-ns-5"
          >
            새 작품
          </Button>
        </div>
      </header>

      {/* 목록 — hydration 전에는 빈 자리만 유지 */}
      {!isReady ? (
        <div className="rounded-ns-xl border border-ns-border bg-ns-surface px-ns-6 py-ns-12 text-center text-ns-sm text-ns-ink-tertiary">
          불러오는 중…
        </div>
      ) : (
        <ProjectList
          projects={projects}
          onEdit={(project) => setModal({ type: "edit", project })}
          onDelete={(project) => setDeleting(project)}
          emptyAction={
            <Button
              type="button"
              onClick={openCreate}
              className="rounded-ns-full px-ns-5"
            >
              새 작품
            </Button>
          }
        />
      )}

      <ProjectModal
        open={modal.type === "create" || modal.type === "edit"}
        mode={modal.type === "edit" ? "edit" : "create"}
        project={modal.type === "edit" ? modal.project : null}
        onClose={closeModal}
        onSubmit={(input) => {
          void (async () => {
            if (modal.type === "edit") {
              await update(modal.project.id, input);
            } else {
              await create(input);
            }
          })();
        }}
      />

      <ProjectDeleteDialog
        open={Boolean(deleting)}
        project={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(project) => {
          void remove(project.id);
        }}
      />
    </div>
  );
}
