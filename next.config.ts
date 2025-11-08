import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack is enabled via --turbo flag in dev/build scripts
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "html.tailus.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
