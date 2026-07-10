import type { NextConfig } from "next";
import path from "path";

/**
 * Novel Studio — Next.js / Vercel 설정
 *
 * - env: NEXT_PUBLIC_* 를 빌드·클라이언트 번들에 명시적으로 전달
 *   (Vercel에 등록만 하고 코드에서 optional chaining 하면 undefined가 될 수 있음)
 * - turbopack.root: 상위 폴더 package-lock 때문에 루트가 잘못 잡히는 것 방지
 * - middleware.ts 없음 — 인증은 클라이언트 AuthGate + Supabase 세션
 */
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
