import fs from "fs"
import path from "path"

const violations: string[] = []

function scan(dir: string) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)

    if (fs.statSync(full).isDirectory()) {
      scan(full)
      continue
    }

    const content = fs.readFileSync(full, "utf-8")

    // ❌ WALLET RULE
    if (full.includes("/wallet") && content.includes("ExecutionTruthKernel")) {
      violations.push(`WALLET importing ETK → ${full}`)
    }

    // ❌ TREASURY DIRECT WALLET DECISION
    if (full.includes("/treasury") && content.includes("wallet.transferToken") && content.includes("etk.decide")) {
      violations.push(`TREASURY bypassing control flow → ${full}`)
    }

    // ❌ UI ENGINE ACCESS
    if (full.includes("components") && content.includes("engines/")) {
      violations.push(`UI directly importing engine → ${full}`)
    }

    // ❌ SPINE DOING EXECUTION
    if (full.includes("spine") && content.includes("transferToken")) {
      violations.push(`SPINE executing wallet action → ${full}`)
    }

    // ❌ STREAM MODIFICATION
    if (full.includes("ExecutionStream") && content.includes("write") && content.includes("wallet")) {
      violations.push(`STREAM mutation detected → ${full}`)
    }
  }
}

scan(path.resolve("src"))

if (violations.length) {
  console.error("\n🚨 CONTROL TOPOLOGY VIOLATIONS DETECTED:\n")
  violations.forEach(v => console.error(" -", v))
  process.exit(1)
}

console.log("✅ Control topology clean")