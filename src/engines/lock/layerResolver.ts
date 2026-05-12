export function resolveLayer(filePath: string): string {
  if (filePath.includes("/ui/")) return "ui"
  if (filePath.includes("/client")) return "client"
  if (filePath.includes("ExecutionStream")) return "stream"
  if (filePath.includes("governance")) return "governance"
  if (filePath.includes("trace")) return "trace"
  if (filePath.includes("graph")) return "graph"
  return "execution"
}