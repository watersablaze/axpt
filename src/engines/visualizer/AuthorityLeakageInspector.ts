import { authorityLeakageVisualizer } from "./AuthorityLeakageVisualizer"

export function inspectAuthority(entityId: string) {
  const report =
    authorityLeakageVisualizer.analyze(entityId)

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━")
  console.log("AUTHORITY LEAKAGE REPORT")
  console.log("━━━━━━━━━━━━━━━━━━━━━━")

  console.log("Entity:", report.entityId)
  console.log("Severity:", report.severity)
  console.log("Flags:", report.flags)

  console.log("\nBreakdown:")
  console.table(report.breakdown)

  console.log("\nExplanation:")
  report.explanation.forEach(x => console.log("-", x))

  return report
}