const EXTENSION_INTRODUCER = 0x21
const IMAGE_SEPARATOR = 0x2c
const TRAILER = 0x3b
const HEADER_BYTES = 6
const LOGICAL_SCREEN_DESCRIPTOR_BYTES = 7
const IMAGE_DESCRIPTOR_BYTES = 9
const HAS_COLOR_TABLE_FLAG = 0x80
const COLOR_TABLE_SIZE_MASK = 0x07

const colorTableBytes = (packedFields: number) =>
  packedFields & HAS_COLOR_TABLE_FLAG ? 3 * 2 ** ((packedFields & COLOR_TABLE_SIZE_MASK) + 1) : 0

const skipSubBlocks = (bytes: Uint8Array, offset: number) => {
  let cursor = offset
  while (cursor < bytes.length && bytes[cursor] !== 0) {
    cursor += bytes[cursor] + 1
  }
  return cursor + 1
}

const countFrames = (bytes: Uint8Array) => {
  const screenPackedFields = bytes[HEADER_BYTES + 4]
  let cursor = HEADER_BYTES + LOGICAL_SCREEN_DESCRIPTOR_BYTES + colorTableBytes(screenPackedFields)
  let frames = 0

  while (cursor < bytes.length) {
    const blockType = bytes[cursor]
    if (blockType === TRAILER) return frames
    if (blockType === EXTENSION_INTRODUCER) {
      cursor = skipSubBlocks(bytes, cursor + 2)
    } else if (blockType === IMAGE_SEPARATOR) {
      frames++
      if (frames > 1) return frames
      const imagePackedFields = bytes[cursor + IMAGE_DESCRIPTOR_BYTES]
      const lzwMinimumCodeSizeOffset =
        cursor + IMAGE_DESCRIPTOR_BYTES + 1 + colorTableBytes(imagePackedFields)
      cursor = skipSubBlocks(bytes, lzwMinimumCodeSizeOffset + 1)
    } else {
      return Number.POSITIVE_INFINITY
    }
  }

  return Number.POSITIVE_INFINITY
}

// Anything unparseable counts as animated: uploading a GIF untouched is the safe
// fallback, whereas a canvas re-encode would flatten a real animation to one frame.
export const isAnimatedGif = async (file: Blob): Promise<boolean> => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const signature = new TextDecoder().decode(bytes.subarray(0, HEADER_BYTES))
  if (signature !== "GIF87a" && signature !== "GIF89a") return true
  return countFrames(bytes) !== 1
}
