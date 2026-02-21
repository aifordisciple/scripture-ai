
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // 开发模式下禁用，防止缓存干扰开发
});

const nextConfig: NextConfig = {
  output: "standalone",
};

export default withPWA(nextConfig);