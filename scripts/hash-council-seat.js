const { createHash } = require("crypto");

const seatKey = process.argv[2];

if (!seatKey) {
  console.error("Usage: node scripts/hash-council-seat.js <SEAT_KEY>");
  process.exit(1);
}

const hash = createHash("sha256")
  .update(seatKey, "utf8")
  .digest("hex");

console.log(hash);