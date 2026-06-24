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
    ],
  },
}

export default nextConfig
