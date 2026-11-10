export const OWN_IMAGE_HOSTS = [
  "pub-017886dc539b41789e7c76de04239c5d.r2.dev",
  "cdn.foodiesfinds.com",
]

const hostnameOf = (src: string) => {
  try {
    return new URL(src).hostname
  } catch {
    return null
  }
}

// Relative paths and bare R2 keys have no hostname and are ours. Imported recipes can
// point at any publisher's image host, which next/image would reject unless unoptimized.
export const isOwnImage = (src: string) => {
  const hostname = hostnameOf(src)
  return hostname === null || OWN_IMAGE_HOSTS.includes(hostname)
}

export const recipeImageSrc = (imageUrl: string | null | undefined) =>
  imageUrl?.trim() ? imageUrl : "/no-image.jpeg"
