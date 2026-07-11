/**
 * Settings — 에디터 · 테마 · Export · 백업 · 계정
 */

import { SettingsPage } from "@/features/settings";

interface SettingsRoutePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function SettingsRoutePage({
  params,
}: SettingsRoutePageProps) {
  const { projectId } = await params;
  return <SettingsPage projectId={projectId} />;
}
