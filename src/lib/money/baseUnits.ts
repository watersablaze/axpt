import { Decimal } from "@prisma/client/runtime/library"

export function decimalToBigInt(value: Decimal | string | number): bigint {
  return BigInt(value.toString())
}

export function bigintToDecimal(value: bigint): Decimal {
  return new Decimal(value.toString())
}

export function formatBaseUnits(
  amountBaseUnits: bigint,
  decimals: number
): string {
  const negative = amountBaseUnits < 0n
  const abs = negative ? -amountBaseUnits : amountBaseUnits
  const base = 10n ** BigInt(decimals)

  const whole = abs / base
  const fraction = abs % base

  if (decimals === 0) {
    return `${negative ? "-" : ""}${whole}`
  }

  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "")

  return fractionStr.length
    ? `${negative ? "-" : ""}${whole}.${fractionStr}`
    : `${negative ? "-" : ""}${whole}`
}

export function parseDisplayToBaseUnits(
  display: string,
  decimals: number
): bigint {
  const normalized = display.trim()
  const negative = normalized.startsWith("-")
  const unsigned = negative ? normalized.slice(1) : normalized

  if (!/^\d+(\.\d+)?$/.test(unsigned)) {
    throw new Error(`Invalid amount: ${display}`)
  }

  const [whole, fraction = ""] = unsigned.split(".")

  if (fraction.length > decimals) {
    throw new Error(`Too many decimal places (max ${decimals})`)
  }

  const padded = fraction.padEnd(decimals, "0")
  const combined = `${whole}${padded}`.replace(/^0+(?=\d)/, "") || "0"

  const value = BigInt(combined)
  return negative ? -value : value
}
