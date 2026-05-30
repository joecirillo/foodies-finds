export const toTitleCase = (str: string): string => {
  if (!str) return str
  return str
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-"),
    )
    .join(" ")
}

export const toSentenceCase = (str: string): string => {
  if (!str) return str
  const parts = str.split(/([.!?] )/g)
  return parts
    .map((part, i) => {
      if (i % 2 === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1)
      }
      return part
    })
    .join("")
}

export const lowerFirst = (str: string): string => {
  if (!str) return str
  return str.charAt(0).toLowerCase() + str.slice(1)
}
