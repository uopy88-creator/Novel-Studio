/**
 * Characters — 인물 프로필.
 * 사이드바 Characters 메뉴와 연결된다.
 */

import { CharactersPage } from "@/features/characters";

interface CharactersRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function CharactersRoutePage({
  params,
}: CharactersRoutePageProps) {
  const { projectId } = await params;
  return <CharactersPage projectId={projectId} />;
}
