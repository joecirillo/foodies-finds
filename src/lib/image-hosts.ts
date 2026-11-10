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

const isRelativePathOrStorageKey = (src: string) => hostnameOf(src) === null

export const isOwnImage = (src: string) =>
  isRelativePathOrStorageKey(src) || OWN_IMAGE_HOSTS.includes(hostnameOf(src) ?? "")

export const recipeImageProps = (imageUrl: string | null | undefined) => {
  const src = imageUrl?.trim() ? imageUrl : "/no-image.jpeg"
  return { src, unoptimized: !isOwnImage(src) }
}
