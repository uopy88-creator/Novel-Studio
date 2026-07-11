/**
 * Foreshadowing — 기능 미구현, Context Help 제공
 */

import { ComingSoon } from "@/components/layout";

interface ForeshadowingPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ForeshadowingPage({
  params,
}: ForeshadowingPageProps) {
  const { projectId } = await params;
  return (
    <ComingSoon
      featureName="Foreshadowing"
      helpTopic="foreshadowing"
      projectId={projectId}
    />
  );
}
