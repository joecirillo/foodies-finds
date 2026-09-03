export const getSiteUrl = (): string => {
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return productionUrl ? `https://${productionUrl}` : "http://localhost:3000"
}
