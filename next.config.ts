import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "t.me", pathname: "/**" },
      { protocol: "https", hostname: "telegram.org", pathname: "/**" },
    ],
  },
};

export default nextConfig;
