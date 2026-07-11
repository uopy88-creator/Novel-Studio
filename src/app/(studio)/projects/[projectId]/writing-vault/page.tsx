/**
 * Writing Vault — 문장·단어·아이디어 금고.
 */

import { WritingVaultPage } from "@/features/dialogue-vault";

interface WritingVaultRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function WritingVaultRoutePage({
  params,
}: WritingVaultRoutePageProps) {
  const { projectId } = await params;
  return <WritingVaultPage projectId={projectId} />;
}
