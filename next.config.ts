import type { NextConfig } from "next";
import path from "path";

/**
 * Novel Studio — Next.js / Vercel 설정
 *
 * NEXT_PUBLIC_* 는 코드에서 process.env.NEXT_PUBLIC_* 로 직접 참조한다.
 * next.config env 로 덮어쓰지 않는다.
 * (빈 문자열로 덮어쓰면 클라이언트에서 undefined/오동작이 난다.)
 *
 * turbopack.root: 상위 폴더 package-lock 때문에 루트가 잘못 잡히는 것 방지
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
