import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "app/api/admin/applications/[id]/send-contract/route": ["./contracts/**/*"],
  },
};

export default nextConfig;
