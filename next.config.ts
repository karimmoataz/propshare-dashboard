import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
    dirs: [],
  },
  typescript: {
    ignoreBuildErrors: true, // Optional: Disable TypeScript errors too
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
};

export default nextConfig;
