import { dagValidator } from "../src/engines/lock/DAGValidator"
import fs from "fs"
import path from "path"

const edges: Array<{ from: string; to: string }> = []

function scan(dir: string) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)

    if (fs.statSync(full).isDirectory()) {
      scan(full)
    } else {
      const content = fs.readFileSync(full, "utf-8")

      const imports = content.match(/from\s+['"](.*)['"]/g) || []

      for (const imp of imports) {
        const match = imp.match(/['"](.*)['"]/)
        if (!match) continue

        edges.push({
          from: full,
          to: match[1],
        })
      }
    }
  }
}

scan("./src")

dagValidator.validate(edges)

console.log("✅ DAG VALIDATION PASSED")