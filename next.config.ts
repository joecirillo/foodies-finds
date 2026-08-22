import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
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
    ],
  },
}

export default nextConfig
