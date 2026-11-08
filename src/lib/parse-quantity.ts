const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
}

const DECIMAL = /^(-?(?:\d+(?:\.\d*)?|\.\d+))$/
const FRACTION = /^(\d+)\/(\d+)$/
const MIXED_NUMBER = /^(\d+)[\s-]+(\d+)\/(\d+)$/

// Stored as numeric(8, 2) by recipe-api, so rounding here keeps the edit form's
// change detection in step with what a reload will return.
const roundToStoredPrecision = (value: number) => Math.round(value * 100) / 100

const normalize = (text: string) =>
  text
    .trim()
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (glyph) => ` ${UNICODE_FRACTIONS[glyph]}`)
    .replace(/⁄/g, "/")
    .replace(/,/g, ".")
    .replace(/\s*\/\s*/g, "/")
    .trim()

const divide = (numerator: string, denominator: string) =>
  Number(denominator) === 0 ? NaN : Number(numerator) / Number(denominator)

export const parseQuantity = (text: string): number | null => {
  const normalized = normalize(text)
  if (!normalized) return null

  const decimal = DECIMAL.exec(normalized)
  if (decimal) return roundToStoredPrecision(Number(decimal[1]))

  const fraction = FRACTION.exec(normalized)
  if (fraction) return roundToStoredPrecision(divide(fraction[1], fraction[2]))

  const mixed = MIXED_NUMBER.exec(normalized)
  if (mixed) return roundToStoredPrecision(Number(mixed[1]) + divide(mixed[2], mixed[3]))

  return NaN
}

export const formatQuantityInput = (quantity: number | null) =>
  quantity === null ? "" : String(quantity)
