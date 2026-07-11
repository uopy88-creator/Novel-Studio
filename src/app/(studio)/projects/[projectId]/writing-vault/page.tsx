/**
 * Writing Vault — 문장·단어·아이디어 금고.
 * ?id= 로 특정 항목을 바로 연다 (전역 검색).
 */

import { WritingVaultPage } from "@/features/dialogue-vault";

interface WritingVaultRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function WritingVaultRoutePage({
  params,
  searchParams,
}: WritingVaultRoutePageProps) {
  const { projectId } = await params;
  const { id } = await searchParams;
  return <WritingVaultPage projectId={projectId} initialEntryId={id} />;
}
