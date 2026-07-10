/**
 * Dialogue Vault — 대사 금고.
 * 사이드바 Dialogue Vault 메뉴와 연결된다.
 */

import { DialogueVaultPage } from "@/features/dialogue-vault";

interface DialogueVaultRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DialogueVaultRoutePage({
  params,
}: DialogueVaultRoutePageProps) {
  const { projectId } = await params;
  return <DialogueVaultPage projectId={projectId} />;
}
