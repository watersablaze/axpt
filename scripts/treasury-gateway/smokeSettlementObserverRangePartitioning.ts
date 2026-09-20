import {
  partitionSettlementObserverBlockRange,
  SETTLEMENT_OBSERVER_LOG_WINDOW_BLOCKS,
} from "../../src/domains/treasury/settlement-observer/ingestSettlementObservationRangeWithClient";

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(
      `[SMOKE_SETTLEMENT_OBSERVER_RANGE_PARTITION_FAILED] ${message}`,
    );
  }
}

function signature(
  windows:
    readonly Readonly<{
      fromBlock: bigint;
      toBlock: bigint;
    }>[],
) {
  return windows.map(
    (window) =>
      `${window.fromBlock.toString()}-${window.toBlock.toString()}`,
  );
}

const one =
  partitionSettlementObserverBlockRange(
    100n,
    100n,
  );

assert(
  JSON.stringify(signature(one)) ===
    JSON.stringify([
      "100-100",
    ]),
  "single block range",
);

const ten =
  partitionSettlementObserverBlockRange(
    100n,
    109n,
  );

assert(
  JSON.stringify(signature(ten)) ===
    JSON.stringify([
      "100-109",
    ]),
  "exact ten block range",
);

const eleven =
  partitionSettlementObserverBlockRange(
    100n,
    110n,
  );

assert(
  JSON.stringify(signature(eleven)) ===
    JSON.stringify([
      "100-109",
      "110-110",
    ]),
  "eleven block split",
);

const thirtySeven =
  partitionSettlementObserverBlockRange(
    100n,
    136n,
  );

assert(
  JSON.stringify(
    signature(thirtySeven),
  ) ===
    JSON.stringify([
      "100-109",
      "110-119",
      "120-129",
      "130-136",
    ]),
  "37 block observer range",
);

for (
  const window of
  thirtySeven
) {
  const width =
    window.toBlock -
    window.fromBlock +
    1n;

  assert(
    width <=
      SETTLEMENT_OBSERVER_LOG_WINDOW_BLOCKS,
    `window exceeds provider bound: ${width.toString()}`,
  );
}

assert(
  thirtySeven[0]?.fromBlock ===
    100n,
  "first block preserved",
);

assert(
  thirtySeven[
    thirtySeven.length - 1
  ]?.toBlock ===
    136n,
  "last block preserved",
);

for (
  let index = 1;
  index <
  thirtySeven.length;
  index += 1
) {
  assert(
    thirtySeven[index]
      .fromBlock ===
      thirtySeven[index - 1]
        .toBlock +
        1n,
    "windows must be contiguous",
  );
}

let invalidRangeRejected =
  false;

try {
  partitionSettlementObserverBlockRange(
    10n,
    9n,
  );
} catch {
  invalidRangeRejected =
    true;
}

assert(
  invalidRangeRejected,
  "invalid reverse range must reject",
);

console.log(
  "SMOKE_SETTLEMENT_OBSERVER_RANGE_PARTITION_OK",
);

console.log({
  maximumBlocksPerRpcRequest:
    SETTLEMENT_OBSERVER_LOG_WINDOW_BLOCKS
      .toString(),

  thirtySevenBlockLogicalRange:
    signature(
      thirtySeven,
    ),
});
