/**
 * Characters — 인물 프로필.
 * ?id= 로 특정 캐릭터를 바로 연다 (전역 검색).
 */

import { CharactersPage } from "@/features/characters";

interface CharactersRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function CharactersRoutePage({
  params,
  searchParams,
}: CharactersRoutePageProps) {
  const { projectId } = await params;
  const { id } = await searchParams;
  return (
    <CharactersPage projectId={projectId} initialCharacterId={id} />
  );
}
