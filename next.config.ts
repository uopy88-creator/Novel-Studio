import type { NextConfig } from "next";
import path from "path";

/**
 * Novel Studio — Next.js / Vercel 설정
 *
 * - turbopack.root: 상위 폴더의 package-lock.json 때문에
 *   워크스페이스 루트가 잘못 잡히는 것을 막는다. (로컬·Vercel 공통)
 * - middleware.ts 는 두지 않는다.
 *   인증은 클라이언트 AuthGate + Supabase 세션으로 처리한다.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
