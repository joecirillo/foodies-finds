import type { NextConfig } from "next"
import { OWN_IMAGE_HOSTS } from "./src/lib/image-hosts"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server actions only carry JSON now — image bytes go straight from the
      // browser to R2 via a presigned URL, not through this app's server.
      bodySizeLimit: "1mb",
    },
  },
  images: {
    remotePatterns: OWN_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
}

export default nextConfig
