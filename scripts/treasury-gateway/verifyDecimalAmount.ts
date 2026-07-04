import assert from "node:assert/strict";

import {
  addDecimals,
  assertPositiveDecimal,
  compareDecimals,
  subtractDecimals,
} from "../../src/domains/treasury/gateway/shared/decimalAmount";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

assert.equal(addDecimals("0.1", "0.2"), "0.3");

assert.equal(addDecimals("1", "0.000001"), "1.000001");

assert.equal(
  addDecimals("999999999999999999999.123456789", "0.876543211"),
  "1000000000000000000000",
);

assert.equal(subtractDecimals("10", "3.25"), "6.75");

assert.equal(compareDecimals("1.0", "1"), 0);

assert.equal(compareDecimals("0.999", "1"), -1);

assert.equal(compareDecimals("1.000001", "1"), 1);

assert.doesNotThrow(() => {
  assertPositiveDecimal("0.000001");
});

assertThrowsWithCode(
  () => assertPositiveDecimal("0"),
  "TREASURY_DECIMAL_NOT_POSITIVE",
);

assertThrowsWithCode(
  () => subtractDecimals("1", "2"),
  "TREASURY_DECIMAL_SUBTRACTION_UNDERFLOW",
);

assertThrowsWithCode(() => addDecimals("1e6", "1"), "TREASURY_DECIMAL_INVALID");

console.log("✓ Treasury decimal verification passed");
