import fs from "fs"
import path from "path"

const SRC = path.resolve("src")

const edges: Array<{ from: string; to: string }> = []

function scanFile(file: string) {
  const content = fs.readFileSync(file, "utf-8")

  const imports = content.match(/from\s+['"](.*)['"]/g) || []

  for (const imp of imports) {
    const match = imp.match(/['"](.*)['"]/)
    if (!match) continue

    const target = match[1]

    edges.push({
      from: file,
      to: target,
    })
  }
}

function walk(dir: string) {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const full = path.join(dir, file)

    if (fs.statSync(full).isDirectory()) {
      walk(full)
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      scanFile(full)
    }
  }
}

walk(SRC)