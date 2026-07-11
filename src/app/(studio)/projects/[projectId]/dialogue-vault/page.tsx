/**
 * 구 Dialogue Vault 경로 → Writing Vault 로 리다이렉트.
 */

import { redirect } from "next/navigation";

interface LegacyDialogueVaultRouteProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function LegacyDialogueVaultRoute({
  params,
}: LegacyDialogueVaultRouteProps) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/writing-vault`);
}
