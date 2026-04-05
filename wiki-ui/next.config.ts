import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the app to read from the parent wiki/ directory at build time
  serverExternalPackages: ["gray-matter"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
