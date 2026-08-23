import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server actions only carry JSON now — image bytes go straight from the
      // browser to R2 via a presigned URL, not through this app's server.
      bodySizeLimit: "1mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "foodies-finds-recipe-images.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pub-017886dc539b41789e7c76de04239c5d.r2.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.foodiesfinds.com",
      },
    ],
  },
}

export default nextConfig
