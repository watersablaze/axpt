export function createTransactionIntakeReference() {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()

  return `AXPT-INT-${year}-${random}`
}
