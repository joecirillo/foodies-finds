import type { ImportErrorCode } from "@/types/recipe"

const IMPORT_ERROR_CODES = new Set<string>([
  "INVALID_URL",
  "SOURCE_NOT_ALLOWED",
  "FETCH_FAILED",
  "SOURCE_HTTP_ERROR",
  "FETCH_TIMEOUT",
  "SOURCE_BLOCKED",
  "RESPONSE_TOO_LARGE",
  "UNSUPPORTED_CONTENT_TYPE",
  "NO_RECIPE_FOUND",
] satisfies ImportErrorCode[])

export const isImportErrorCode = (value: unknown): value is ImportErrorCode =>
  typeof value === "string" && IMPORT_ERROR_CODES.has(value)
