/**
 * Memo — 기능 미구현, Context Help 제공
 */

import { ComingSoon } from "@/components/layout";

interface MemoPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function MemoPage({ params }: MemoPageProps) {
  const { projectId } = await params;
  return (
    <ComingSoon
      featureName="Memo"
      helpTopic="memo"
      projectId={projectId}
    />
  );
}
