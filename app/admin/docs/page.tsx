import { prisma } from "@/lib/prisma"

export default async function AdminDocsPage() {
  const docs = await prisma.document.findMany({
    orderBy: {
      createdAt: "desc"
    }
  })

  return (
    <div style={{ padding: 30 }}>
      <h1>Document Vault</h1>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Case</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {docs.map(doc => (
            <tr key={doc.id}>
              <td>{doc.title}</td>
              <td>{doc.caseId ?? "—"}</td>
              <td>{doc.createdAt.toISOString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}