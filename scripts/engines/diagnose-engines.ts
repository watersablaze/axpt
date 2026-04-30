import { execSync } from "child_process"

const output = execSync("pnpm tsc --noEmit --pretty false", {
  encoding: "utf-8",
})

const lines = output.split("\n")

type Bucket = {
  file: string
  errors: string[]
}

const buckets = new Map<string, string[]>()

for (const line of lines) {
  const match = line.match(/\.\/src\/(.+?):/)
  if (!match) continue

  const file = match[1]
  const existing = buckets.get(file) ?? []
  existing.push(line)
  buckets.set(file, existing)
}

console.log("\n🧬 AXPT ENGINE FAILURE MAP\n")

for (const [file, errors] of buckets.entries()) {
  console.log("\n──────────────────────────────")
  console.log("📁", file)
  console.log("──────────────────────────────")
  for (const e of errors) {
    console.log("  •", e)
  }
}