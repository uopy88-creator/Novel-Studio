import { redirect } from "next/navigation";
import { studioPath } from "@/components/layout/nav-items";

interface ChaptersRoutePageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ChaptersRoutePage({ params }: ChaptersRoutePageProps) {
  const { projectId } = await params;
  redirect(studioPath(projectId, "manuscript"));
}
