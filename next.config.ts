import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/admin/applications/[id]/send-contract": ["./contracts/**/*"],
  },
};

export default nextConfig;
