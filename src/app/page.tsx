import { ProjectsPage } from "@/features/projects";

/**
 * 첫 화면 = 작품 목록.
 * Dashboard 등 다른 기능은 여기서 렌더하지 않는다.
 */
export default function HomePage() {
  return <ProjectsPage />;
}
