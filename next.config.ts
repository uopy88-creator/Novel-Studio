import type { NextConfig } from "next";
import path from "path";

/**
 * turbopack.root: 상위 폴더(C:\\Users\\Admin)의 package-lock.json 때문에
 * 워크스페이스 루트가 잘못 잡히는 것을 막는다.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
