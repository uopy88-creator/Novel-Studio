/**
 * 작업실 안 Help — 사이드바에서 진입.
 * 본문은 /help 와 동일한 HelpPage 를 사용한다.
 */

import { HelpPage } from "@/features/help";

interface ProjectHelpPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectHelpPage({
  params,
}: ProjectHelpPageProps) {
  const { projectId } = await params;
  return (
    <HelpPage
      embedded
      backHref={`/projects/${projectId}/dashboard`}
      backLabel="Dashboard"
    />
  );
}
