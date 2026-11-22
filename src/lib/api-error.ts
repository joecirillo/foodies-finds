export type ApiError = Error & { code: string; errorCode?: string }

export const isApiError = (value: unknown): value is ApiError =>
  value instanceof Error && typeof (value as Partial<ApiError>).code === "string"

export const apiError = async (res: Response): Promise<ApiError> => {
  const body = await res.json().catch(() => null)
  const message = body?.message ?? `API ${res.status}`
  const err = new Error(message) as ApiError
  err.code = String(res.status)
  if (typeof body?.code === "string") err.errorCode = body.code
  return err
}
