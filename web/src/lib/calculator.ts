export function sanitizeNumeric(value: string): string {
  return value.replace(/[^0-9.,]/g, "")
}

export function enforcePercentLimit(value: string): string {
  if (!value) return ""
  if (value.includes(".") || value.includes(",")) {
    return value
  }
  if (value.length <= 4) return value
  return value.slice(0, 4)
}

export function computeVolume(
  stopAmount: string,
  percent: string,
): number | null {
  const stopAmountNum = parseFloat(stopAmount.replace(",", "."))
  if (Number.isNaN(stopAmountNum)) return null

  const divisorString = makeDivisorString(percent)
  if (!divisorString) return null

  const divisor = Number(divisorString)
  if (!Number.isFinite(divisor) || divisor === 0) return null

  const volume = stopAmountNum / divisor
  return Math.round(volume * 10) / 10
}

function makeDivisorString(percent: string): string | null {
  const trimmed = percent.trim()
  if (!trimmed) return null

  if (trimmed.includes(".") || trimmed.includes(",")) {
    const normalized = trimmed.replace(",", ".")
    const digits = normalized.replace(".", "")
    return `0.${digits}`
  }

  switch (trimmed.length) {
    case 1:
      return `0.000${trimmed}`
    case 2:
      return `0.00${trimmed}`
    case 3:
      return `0.0${trimmed}`
    case 4:
      return `0.${trimmed}`
    default:
      return null
  }
}



