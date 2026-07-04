import type { DecimalString } from "./money";

type ParsedDecimal = Readonly<{
  units: bigint;

  scale: number;
}>;

function parseDecimal(value: DecimalString): ParsedDecimal {
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) {
    throw new Error(`[TREASURY_DECIMAL_INVALID] ${value}`);
  }

  const [whole, fraction = ""] = value.split(".");

  return {
    units: BigInt(`${whole}${fraction}`),

    scale: fraction.length,
  };
}

function alignDecimals(
  left: DecimalString,
  right: DecimalString,
): Readonly<{
  leftUnits: bigint;

  rightUnits: bigint;

  scale: number;
}> {
  const parsedLeft = parseDecimal(left);

  const parsedRight = parseDecimal(right);

  const scale = Math.max(parsedLeft.scale, parsedRight.scale);

  const leftUnits = parsedLeft.units * 10n ** BigInt(scale - parsedLeft.scale);

  const rightUnits =
    parsedRight.units * 10n ** BigInt(scale - parsedRight.scale);

  return {
    leftUnits,

    rightUnits,

    scale,
  };
}

function formatDecimal(units: bigint, scale: number): DecimalString {
  if (units < 0n) {
    throw new Error("[TREASURY_DECIMAL_NEGATIVE_RESULT]");
  }

  if (scale === 0) {
    return units.toString();
  }

  const padded = units.toString().padStart(scale + 1, "0");

  const whole = padded.slice(0, -scale);

  const fraction = padded.slice(-scale).replace(/0+$/, "");

  if (fraction.length === 0) {
    return whole;
  }

  return `${whole}.${fraction}`;
}

export function assertPositiveDecimal(value: DecimalString): void {
  const parsed = parseDecimal(value);

  if (parsed.units <= 0n) {
    throw new Error(`[TREASURY_DECIMAL_NOT_POSITIVE] ${value}`);
  }
}

export function compareDecimals(
  left: DecimalString,
  right: DecimalString,
): -1 | 0 | 1 {
  const { leftUnits, rightUnits } = alignDecimals(left, right);

  if (leftUnits < rightUnits) {
    return -1;
  }

  if (leftUnits > rightUnits) {
    return 1;
  }

  return 0;
}

export function addDecimals(
  left: DecimalString,
  right: DecimalString,
): DecimalString {
  const { leftUnits, rightUnits, scale } = alignDecimals(left, right);

  return formatDecimal(leftUnits + rightUnits, scale);
}

export function subtractDecimals(
  left: DecimalString,
  right: DecimalString,
): DecimalString {
  const { leftUnits, rightUnits, scale } = alignDecimals(left, right);

  if (rightUnits > leftUnits) {
    throw new Error(
      `[TREASURY_DECIMAL_SUBTRACTION_UNDERFLOW] ${left} - ${right}`,
    );
  }

  return formatDecimal(leftUnits - rightUnits, scale);
}
