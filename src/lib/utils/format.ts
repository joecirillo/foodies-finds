export const formatMinutes = (mins: number): string => {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export const formatQuantity = (qty: number | null, unit: string | null): string => {
  if (qty === null) return ""
  const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1)
  return unit ? `${qtyStr} ${unit}` : qtyStr
}
