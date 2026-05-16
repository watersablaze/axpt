import { authorityLeakageVisualizer } from "./AuthorityLeakageVisualizer"

export function inspectAuthority(entityId: string) {

  const graph =
    authorityLeakageVisualizer
      .getGraph()
      .filter(x => x.entityId === entityId)

  const leakage =
    authorityLeakageVisualizer.detectLeakage()

  const report = {
    entityId,
    severity: leakage.length ? "HIGH" : "LOW",
    flags: leakage.map(x => x.type),
    breakdown: graph,
    explanation: leakage.map(
      x => `Leakage event detected: ${x.type}`
    ),
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━")
  console.log("AUTHORITY LEAKAGE REPORT")
  console.log("━━━━━━━━━━━━━━━━━━━━━━")

  console.log("Entity:", report.entityId)
  console.log("Severity:", report.severity)
  console.log("Flags:", report.flags)

  console.log("\nBreakdown:")
  console.table(report.breakdown)

  console.log("\nExplanation:")
  report.explanation.forEach((x: string) =>
    console.log("-", x)
  )

  return report
}